import { Num, uaUST, uUST } from '@anchor-protocol/notation';
import { gql, QueryResult, useQuery } from '@apollo/client';
import { useAddressProvider } from 'contexts/contract';
import { useMemo } from 'react';

export interface StringifiedData {
  currentBlock: number;
  marketBalance: {
    Result: { Denom: string; Amount: Num<string> }[];
  };
  marketState: {
    Result: string;
  };
}

export interface Data {
  currentBlock: number;
  marketBalance: { Denom: string; Amount: Num<string> }[];
  marketState: {
    total_liabilities: uUST<string>;
    total_reserves: uaUST<string>;
    last_interest_updated: number;
    global_interest_index: Num<string>;
  };
}

export function parseData({
  currentBlock,
  marketBalance,
  marketState,
}: StringifiedData): Data {
  return {
    currentBlock,
    marketBalance: marketBalance.Result,
    marketState: JSON.parse(marketState.Result),
  };
}

export interface StringifiedVariables {
  marketContractAddress: string;
  marketStateQuery: string;
}

export interface Variables {
  marketContractAddress: string;
  marketStateQuery: {
    state: {};
  };
}

export function stringifyVariables({
  marketContractAddress,
  marketStateQuery,
}: Variables): StringifiedVariables {
  return {
    marketContractAddress,
    marketStateQuery: JSON.stringify(marketStateQuery),
  };
}

export const query = gql`
  query($marketContractAddress: String!, $marketStateQuery: String!) {
    # current block height, synced in mantle
    currentBlock: LastSyncedHeight

    # uusd balance of market contract
    marketBalance: BankBalancesAddress(Address: $marketContractAddress) {
      Result {
        Denom
        Amount
      }
    }

    # read market state
    # https://app.gitbook.com/@anchor-protocol/s/anchor-1/smart-contracts/money-market/market#stateresponse
    marketState: WasmContractsContractAddressStore(
      ContractAddress: $marketContractAddress
      QueryMsg: $marketStateQuery
    ) {
      Result
    }
  }
`;

export function useMarketBalanceOverview(): QueryResult<
  StringifiedData,
  StringifiedVariables
> & { parsedData: Data | undefined } {
  const addressProvider = useAddressProvider();

  const result = useQuery<StringifiedData, StringifiedVariables>(query, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 1000 * 60,
    variables: stringifyVariables({
      marketContractAddress: addressProvider.market('uusd'),
      marketStateQuery: {
        state: {},
      },
    }),
  });

  const parsedData = useMemo(
    () => (result.data ? parseData(result.data) : undefined),
    [result.data],
  );

  return {
    ...result,
    parsedData,
  };
}