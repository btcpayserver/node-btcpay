import * as rp from 'request-promise';
import { BTCPayClient } from '../../src/core/client';
import { Cryptography } from '../../src/core/cryptography';

jest.mock('request-promise');

describe('get_rates', () => {
  const client = new BTCPayClient(
    'https://example.com',
    Cryptography.generate_keypair(),
  );
  const request = rp.get as jest.Mock;

  beforeEach(() => {
    request.mockClear();
    request.mockResolvedValue({ data: [] });
  });

  it('omits the store ID when none is provided', async () => {
    await client.get_rates(['BTC_USD', 'BTC_EUR']);

    const options = request.mock.calls[0][0];
    expect(options.uri).toBe('https://example.com/rates');
    expect(options.qs.currencyPairs).toBe('BTC_USD,BTC_EUR');
    expect(options.qs).not.toHaveProperty('storeID');
  });

  it('includes the supplied store ID', async () => {
    await client.get_rates(['BTC_USD'], 'my-store');

    expect(request.mock.calls[0][0].qs.storeID).toBe('my-store');
  });
});
