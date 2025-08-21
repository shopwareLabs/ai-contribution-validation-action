import { getOctokit } from '@actions/github';

/**
 * GitHub API client for pull request validation.
 */

export interface CommitData {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
}

export interface FileData {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface DiffStats {
  totalAdditions: number;
  totalDeletions: number;
  totalChanges: number;
  filesChanged: number;
}

export interface CommentData {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface CommitStatusData {
  id: number;
  state: 'pending' | 'success' | 'failure' | 'error';
  description: string;
  context: string;
  target_url?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface PRData {
  number: number;
  title: string;
  body: string;
  commits: CommitData[];
  files: FileData[];
  diffStats: DiffStats;
  author?: string; // GitHub user login for bot exclusion feature
}

export class GitHubClient {
  readonly #octokit: ReturnType<typeof getOctokit>;

  constructor(token: string) {
    if (!token) {
      throw new Error('GitHub token is required');
    }

    // Basic GitHub token format validation
    // GitHub tokens can be: ghp_, gho_, ghu_, ghs_, ghr_, github_pat_
    const tokenPattern =
      /^(ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[a-zA-Z0-9_]+$/;
    if (!tokenPattern.test(token)) {
      throw new Error('Invalid GitHub token format');
    }

    this.#octokit = getOctokit(token);
  }

  /**
   * Extracts comprehensive PR data including commits, files, and diff statistics.
   *
   * Uses Promise.all() for parallel API calls to optimize performance
   * when fetching related GitHub data.
   */
  async extractPRData(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<PRData> {
    // Input validation prevents cryptic GitHub API errors by failing fast
    // at method boundaries with actionable error messages
    if (!owner || owner.trim() === '') {
      throw new Error('Invalid repository owner: owner cannot be empty');
    }
    if (!repo || repo.trim() === '') {
      throw new Error('Invalid repository name: repo cannot be empty');
    }
    if (!prNumber || prNumber <= 0 || !Number.isInteger(prNumber)) {
      throw new Error('Invalid PR number: must be a positive integer');
    }

    try {
      const [prResponse, commitsResponse, filesResponse] = await Promise.all([
        this.#octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: prNumber,
        }),
        this.#octokit.rest.pulls.listCommits({
          owner,
          repo,
          pull_number: prNumber,
        }),
        this.#octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number: prNumber,
        }),
      ]);

      const commits: CommitData[] = commitsResponse.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name ?? '',
          email: commit.commit.author?.email ?? '',
          date: commit.commit.author?.date ?? '',
        },
      }));

      const files: FileData[] = filesResponse.data.map(file => {
        const fileData: FileData = {
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
        };
        if (file.patch) {
          fileData.patch = file.patch;
        }
        return fileData;
      });

      const diffStats: DiffStats = {
        totalAdditions: files.reduce((sum, file) => sum + file.additions, 0),
        totalDeletions: files.reduce((sum, file) => sum + file.deletions, 0),
        totalChanges: files.reduce((sum, file) => sum + file.changes, 0),
        filesChanged: files.length,
      };

      return {
        number: prResponse.data.number,
        title: prResponse.data.title,
        body: prResponse.data.body ?? '',
        commits,
        files,
        diffStats,
        author: prResponse.data.user?.login, // Extract PR author for bot detection
      };
    } catch (error) {
      // Transform GitHub API errors into actionable user guidance rather than
      // exposing raw API responses. This approach helps users diagnose issues
      // quickly without requiring deep GitHub API knowledge.
      if (error && typeof error === 'object' && 'status' in error) {
        const statusCode = (error as { status: number }).status;
        const errorObj = error as {
          status: number;
          response?: { data?: { message?: string } };
          message?: string;
        };

        if (statusCode === 404) {
          // Disambiguate 404 errors: repository-level vs PR-level not found
          // GitHub returns same status code but different error messages
          const errorMessage =
            errorObj.response?.data?.message ?? errorObj.message ?? '';
          if (
            errorMessage.includes('Issue not found') ||
            errorMessage.includes('pull request')
          ) {
            return Promise.reject(
              new Error(
                `Pull request #${prNumber} not found in repository "${owner}/${repo}"`
              )
            );
          }
          return Promise.reject(
            new Error(
              `Repository "${owner}/${repo}" not found or you don't have access to it`
            )
          );
        }

        if (statusCode === 403) {
          return Promise.reject(
            new Error(
              `Insufficient permissions to access repository "${owner}/${repo}"`
            )
          );
        }
      }

      // Contextual error wrapping aids debugging by preserving call context
      throw new Error(
        `Failed to fetch PR data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Creates a PR comment with HTML identifier for idempotent operations.
   *
   * Design pattern: HTML comments provide invisible tracking mechanism that
   * enables findCommentByIdentifier() to locate and update existing comments.
   * This prevents duplicate comments on subsequent validation runs and allows
   * multiple validators to coexist by using unique identifiers.
   */
  async createComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string,
    identifier: string
  ): Promise<CommentData> {
    try {
      // HTML comments are invisible to users but allow programmatic tracking -
      // this enables idempotent updates without creating duplicate comments
      const commentBody = `<!-- ${identifier} -->\n${body}`;

      const response = await this.#octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
      });

      return {
        id: response.data.id,
        body: response.data.body as string,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to create comment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findCommentByIdentifier(
    owner: string,
    repo: string,
    prNumber: number,
    identifier: string
  ): Promise<CommentData | null> {
    try {
      const response = await this.#octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
      });

      const identifierPattern = `<!-- ${identifier} -->`;
      const comment = response.data.find(comment =>
        (comment.body as string).includes(identifierPattern)
      );

      if (!comment) {
        return null;
      }

      return {
        id: comment.id,
        body: comment.body as string,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to find comment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async updateComment(
    owner: string,
    repo: string,
    commentId: number,
    body: string,
    identifier: string
  ): Promise<CommentData> {
    try {
      const commentBody = `<!-- ${identifier} -->\n${body}`;

      const response = await this.#octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body: commentBody,
      });

      return {
        id: response.data.id,
        body: response.data.body as string,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to update comment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createCommitStatus(
    owner: string,
    repo: string,
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    description: string,
    context: string = 'ai-validator',
    target_url?: string
  ): Promise<CommitStatusData> {
    try {
      const params: {
        owner: string;
        repo: string;
        sha: string;
        state: 'pending' | 'success' | 'failure' | 'error';
        description: string;
        context: string;
        target_url?: string;
      } = {
        owner,
        repo,
        sha,
        state,
        description,
        context,
      };

      if (target_url) {
        params.target_url = target_url;
      }

      const response =
        await this.#octokit.rest.repos.createCommitStatus(params);

      return {
        id: response.data.id,
        state: response.data.state as
          | 'pending'
          | 'success'
          | 'failure'
          | 'error',
        description: response.data.description ?? '',
        context: response.data.context ?? '',
        target_url: response.data.target_url ?? undefined,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      };
    } catch (error) {
      // Check if it's a rate limit error (HTTP 403 or 429)
      if (
        this.isRateLimitError(error as { status?: number; message?: string })
      ) {
        // 3 attempts with exponential backoff handle transient rate limits gracefully
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            // Exponential backoff: 1s, 2s delay progression
            if (attempt > 0) {
              const delay = 1000 * Math.pow(2, attempt - 1);
              await new Promise(resolve => global.setTimeout(resolve, delay));
            }

            const params: {
              owner: string;
              repo: string;
              sha: string;
              state: 'pending' | 'success' | 'failure' | 'error';
              description: string;
              context: string;
              target_url?: string;
            } = {
              owner,
              repo,
              sha,
              state,
              description,
              context,
            };

            if (target_url) {
              params.target_url = target_url;
            }

            const response =
              await this.#octokit.rest.repos.createCommitStatus(params);

            return {
              id: response.data.id,
              state: response.data.state as
                | 'pending'
                | 'success'
                | 'failure'
                | 'error',
              description: response.data.description ?? '',
              context: response.data.context ?? '',
              target_url: response.data.target_url ?? undefined,
              created_at: response.data.created_at,
              updated_at: response.data.updated_at,
            };
          } catch (retryError) {
            // If this is the last attempt or not a rate limit error, throw
            if (
              attempt === 2 ||
              !this.isRateLimitError(
                retryError as { status?: number; message?: string }
              )
            ) {
              throw new Error(
                `Failed to create commit status after ${attempt + 1} attempts: ${retryError instanceof Error ? retryError.message : String(retryError)}`
              );
            }
          }
        }
      }
      throw new Error(
        `Failed to create commit status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private isRateLimitError(error: {
    status?: number;
    message?: string;
  }): boolean {
    return error?.status === 403 || error?.status === 429;
  }

  /* TODO: Implement proper exponential backoff for retries
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempt: number,
    maxRetries: number = 3
  ): Promise<T> {
    if (attempt > maxRetries) {
      throw new Error(`Max retries (${maxRetries}) exceeded for GitHub API call`);
    }

    // Exponential backoff: 2^attempt seconds (2s, 4s, 8s)
    const delayMs = Math.pow(2, attempt) * 1000;
    
    await new Promise(resolve => setTimeout(resolve, delayMs));

    try {
      return await operation();
    } catch (error) {
      if (this.isRateLimitError(error)) {
        return this.retryWithBackoff(operation, attempt + 1, maxRetries);
      }
      throw error;
    }
  }
  */
}
