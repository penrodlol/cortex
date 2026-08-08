import { Octokit } from '@octokit/rest';
import { env } from 'cloudflare:workers';

export default new Octokit({ auth: env.GITHUB_API_KEY });
