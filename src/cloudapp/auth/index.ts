import axios, { AxiosInstance } from 'axios';
import cheerio from 'cheerio';
import querystring from 'querystring';
import { URL } from 'url';

import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';

const BASE_URL = 'https://share.getcloudapp.com';

class CloudAppAuth {
  private authUrl = `/client_login?source_app=mac`;
  private logInUrl = `/accounts/login`;

  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 60_000,
      baseURL: BASE_URL,
      withCredentials: true,
    });

    axiosCookieJarSupport(this.client);
    this.client.defaults.jar = new tough.CookieJar();
  }

  logIn = async (email: string, password: string): Promise<string> => {
    const csrf = await this.begin();
    await this.auth(csrf, email, password);
    const token = await this.xyz();

    return token;
  };

  begin = async () => {
    console.log('initialising session...');

    const response = await this.client.get<string>(this.authUrl);

    const $ = cheerio.load(response.data);
    const token = $('meta[name=csrf-token]').attr('content');

    if (token == null) {
      throw new Error('could not find/extract CSRF token from log in page');
    }

    console.log('got CSRF token!');

    return token;
  };

  auth = async (token: string, email: string, password: string) => {
    console.log('authenticating...');

    const data = querystring.stringify({
      utf8: '✓',
      authenticity_token: token,
      email,
      password,
    });

    // try {
    const response = await this.client.post<never>(this.logInUrl, data, {
      maxRedirects: 0,
      validateStatus: null,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: this.authUrl,
      },
    });
  };

  xyz = async () => {
    const response = await this.client.get<never>(this.authUrl, {
      maxRedirects: 0,
      validateStatus: null,
    });

    const location = response.headers.location;

    if (typeof location != 'string' || !location.startsWith('cloudapp://')) {
      throw new Error(
        "auth failed? could not find cloudapp:// redirect, so we can't extract a token"
      );
    }

    const url = new URL(location);

    const token = url.searchParams.get('token');

    if (token == null) {
      throw new Error(
        'found cloudapp:// redirect, but it did not contain a token. maybe the API changed?'
      );
    }

    console.log('...got token!');

    return token;
  };
}

export default CloudAppAuth;
