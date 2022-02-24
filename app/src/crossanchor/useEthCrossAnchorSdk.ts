import { useNetwork } from '@anchor-protocol/app-provider';
import { Web3Provider } from '@ethersproject/providers';
import { Network, EthCrossAnchorSdk } from '@anchor-protocol/crossanchor-sdk';
import { LCDClient } from '@terra-money/terra.js';
import { useMemo } from 'react';

export const useEthCrossAnchorSdk = (
  network: Network,
  provider?: Web3Provider,
) => {
  const terra = useNetwork();

  const lcd = useMemo(() => {
    return new LCDClient({
      chainID: terra.chainID,
      URL: terra.lcd,
    });
  }, [terra.chainID, terra.lcd]);

  return useMemo(
    () =>
      new EthCrossAnchorSdk(network, lcd, provider, {
        skipRedemption: true,
        unlimitedAllowance: false,
      }),
    [network, provider, lcd],
  );
};