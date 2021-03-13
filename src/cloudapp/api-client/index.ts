import axios, { AxiosInstance } from 'axios';
import { AxiosAccount, AxiosItem } from './types';

const BASE_URL = 'https://share.getcloudapp.com/api/v4';

class CloudAppAPIClient {
  private token: string;

  private client: AxiosInstance;

  constructor(token: string) {
    this.token = token;

    this.client = axios.create({
      timeout: 60_000,
      baseURL: BASE_URL,
      headers: {
        authorization: this.token,
      },
    });
  }

  account = async () => {
    const response = await this.client.get<AxiosAccount>(`/account`);

    return response.data;
  };

  items = async (
    page: number,
    perPage: number,
    organisationHashId: string,
    width = 128,
    height = 128
  ) => {
    const response = await this.client.get<AxiosItem[]>(`/items`, {
      params: {
        page,
        per_page: perPage,
        organization_id: organisationHashId,
        width,
        height,
      },
    });

    return response.data;
  };

  allItems = async (
    organisationHashId: string,
    perPage = 100,
    width = 128,
    height = 128
  ) => {
    let page = 0;
    let all: AxiosItem[] = [];
    let result: AxiosItem[] = [];

    do {
      console.log(`fetching page ${page} of items`);

      result = await this.items(
        page,
        perPage,
        organisationHashId,
        width,
        height
      );

      all = [...all, ...result];
      page += 1;

      console.log(`...got ${result.length} items`);
    } while (result.length > 0);

    return all;
  };
}

export default CloudAppAPIClient;
