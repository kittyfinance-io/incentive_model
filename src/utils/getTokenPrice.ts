import axios from 'axios';

const cache: {[key: string]: string} = {};

export const loadTokenPrices = async (address: string, chain: string) => {
  var config = {
    method: 'get',
    url: `https://deep-index.moralis.io/api/v2/erc20/${address}/price?chain=${chain}`,
    headers: {
      'x-api-key': 'o4APhPnPagfzQ8sLAohU6wZlV23r9T1tO4j3S40htIoRFvQoChcS3xyElJ6sVvW8',
    },
  };

  try {
    const response = await axios(config);
    cache[address] = JSON.stringify(response.data.usdPrice);
  } catch (err) {
    console.log(err);
  }
};

export const getTokenPrice = (address: string): number => {
  return Number(cache[address]);
};
