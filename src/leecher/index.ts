import axios, { AxiosInstance } from 'axios';
import axiosstreamdownload from '../axios/axiosstreamdownload';

export type Downloadable = {
  url: string;
  path: string;
};

class Leecher {
  private concurrency: number;

  private client: AxiosInstance;

  constructor(concurrency = 10) {
    this.concurrency = concurrency;

    this.client = axios.create({
      timeout: 60_000,
    });

    axiosstreamdownload(this.client);
  }

  pull = async (items: Downloadable[]): Promise<void> => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        await this.download(item.url, item.path);
        console.log(`✅ wrote to: ${item.path}`);
      } catch (e) {
        console.log(`❌ error downloading "${item.url}": ${e}`);
      }
    }
  };

  private download = async (url: string, path: string): Promise<void> => {
    return this.client.download(url, path);
  };
}

export default Leecher;
