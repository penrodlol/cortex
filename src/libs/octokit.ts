import { Octokit } from '@octokit/rest';
import { env } from 'cloudflare:workers';

export type GetRepositoryResponse = Awaited<ReturnType<Octokit['repos']['get']>>['data'];

export default new Octokit({ auth: env.GITHUB_API_KEY });
