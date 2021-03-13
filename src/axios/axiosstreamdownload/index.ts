import { AxiosInstance } from 'axios';
import fs from 'fs';

declare module 'axios' {
  interface AxiosInstance {
    download: (url: string, path: string) => Promise<void>;
  }
}

const axiosstreamdownload = (axios: AxiosInstance): AxiosInstance => {
  axios.download = async (url: string, path: string): Promise<void> => {
    // https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile
    const writer = fs.createWriteStream(path);
    const response = await axios.get(url, {
      method: 'get',
      url,
      responseType: 'stream',
    });

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error: Error | null = null;
      writer.on('error', (err) => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve();
        }
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  };

  return axios;
};

export default axiosstreamdownload;
