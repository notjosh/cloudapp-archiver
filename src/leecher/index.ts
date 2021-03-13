import axios, { AxiosInstance } from 'axios';
import PLimit from 'p-limit';
import axiosstreamdownload from '../axios/axiosstreamdownload';

export type Downloadable = {
  url: string;
  path: string;
};

class Leecher {
  private client: AxiosInstance;
  private concurrency: number;

  constructor(concurrency = 10) {
    this.concurrency = concurrency;
    this.client = axios.create({
      timeout: 60_000,
    });

    axiosstreamdownload(this.client);
  }

  pull = async (items: Downloadable[]): Promise<void> => {
    const limit = PLimit(this.concurrency);

    const queue = items.map((item) =>
      limit(() => this.download(item.url, item.path))
    );

    console.log('beginning queue...');
    await Promise.all(queue);
    console.log('...queue complete!');
  };

  private download = async (url: string, path: string): Promise<void> => {
    try {
      console.log('starting download @ ', path);
      await this.client.download(url, path);
      console.log(`✅ wrote to: ${path}`);
    } catch (e) {
      console.log(`❌ error downloading "${url}": ${e}`);
    }
  };
}

export default Leecher;
