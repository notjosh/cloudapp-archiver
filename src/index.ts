import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import CloudAppAPIClient from './cloudapp/api-client';
import CloudAppAuth from './cloudapp/auth';
import fss, { promises as fs } from 'fs';
import * as Path from 'path';
import { AxiosItem } from './cloudapp/api-client/types';
import Leecher from './leecher';

class CloudappArchiver extends Command {
  static description = 'describe the command here';

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),

    email: flags.string({
      char: 'e',
      description: 'email for cloudapp',
      env: 'CLOUDAPP_EMAIL',
    }),
    password: flags.string({
      char: 'p',
      description: 'password for cloudapp',
      env: 'CLOUDAPP_PASSWORD',
    }),
    token: flags.string({
      char: 't',
      description: 'token for cloudapp',
      env: 'CLOUDAPP_TOKEN',
    }),
    dir: flags.string({
      char: 'd',
      description: 'directory to write files',
      default: 'out',
    }),
    force: flags.boolean({
      char: 'f',
      description: 'force a full flow, ignoring caches',
      default: false,
    }),
    latest: flags.boolean({
      char: 'l',
      description: 'update caches, and pull any new items',
      default: false,
    }),
  };

  // static args = [{ name: 'file' }];

  async run() {
    const { args, flags } = this.parse(CloudappArchiver);

    let token: string;

    if (flags.force === true || flags.token == null) {
      this.log('no token provided, beginning authentication...');

      const email = flags.email ?? (await cli.prompt('cloudapp email'));
      const password =
        flags.password ??
        (await cli.prompt('cloudapp password', { type: 'hide' }));

      const auth = new CloudAppAuth();

      token = await auth.logIn(email, password);

      this.log(`got token: ${token}`);
    } else {
      this.log('token provided, so skipping authentication');

      token = flags.token;
    }

    const dir = Path.join(process.cwd(), flags.dir);
    if (!fss.existsSync(dir)) {
      await fs.mkdir(dir);
    }

    const itemsPath = Path.join(dir, 'items.json');
    let items: AxiosItem[];
    if (
      flags.latest === true ||
      flags.force === true ||
      !fss.existsSync(itemsPath)
    ) {
      this.log('fetching latest list of items');

      const client = new CloudAppAPIClient(token);
      const account = await client.account();
      items = await client.allItems(account.last_accessed_org_hashid);

      this.log('saving items to cache');
      await fs.writeFile(itemsPath, JSON.stringify(items, null, 2));
    } else {
      this.log('reading items from cache');
      const data = await fs.readFile(itemsPath, 'utf8');
      items = JSON.parse(data);
    }

    console.log(`got ${items.length} items`);

    let downloadables = items.map((item) => ({
      url: item.source_url,
      path: Path.join(
        dir,
        `${item.id}-${item.file_name_without_ext}${item.file_ext}`
      ),
    }));

    // downloadables = downloadables.slice(0, 20);

    // filter out any items already on disk, unless we're forcing
    const shouldRedownload = flags.force === true;
    if (!shouldRedownload) {
      downloadables = downloadables.filter(
        (item) => !fss.existsSync(item.path)
      );
    }

    const leecher = new Leecher(10);
    leecher.pull(downloadables);
  }
}

export = CloudappArchiver;
