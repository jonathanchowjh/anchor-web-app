import { ExecuteMsg } from '@anchor-protocol/anchor.js';
import { IconSpan } from '@anchor-protocol/neumorphism-ui/components/IconSpan';
import { InfoTooltip } from '@anchor-protocol/neumorphism-ui/components/InfoTooltip';
import { NumberInput } from '@anchor-protocol/neumorphism-ui/components/NumberInput';
import {
  formatExecuteMsgNumber,
  MAX_EXECUTE_MSG_DECIMALS,
} from '@anchor-protocol/notation';
import { Rate } from '@anchor-protocol/types';
import { UpdateConfig as InterestModelUpdateConfig } from '@anchor-protocol/types/contracts/moneyMarket/interestModel/updateConfig';
import { InputAdornment } from '@material-ui/core';
import big from 'big.js';
import { useConstants } from '@anchor-protocol/web-contexts/contexts/contants';
import { useContractAddress } from '@anchor-protocol/web-contexts/contexts/contract';
import { PollCreateBase } from 'pages/gov/components/PollCreateBase';
import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';

export function PollCreateModifyBorrowInterest() {
  // ---------------------------------------------
  // dependencies
  // ---------------------------------------------
  const address = useContractAddress();
  const { blocksPerYear } = useConstants();

  // ---------------------------------------------
  // states
  // ---------------------------------------------
  const [baseBorrowRate, setBaseBorrowRate] = useState<string>('');
  const [interestMultiplier, setInterestMultiplier] = useState<string>('');

  const inputDisabled = useMemo(() => {
    if (baseBorrowRate.length > 0) {
      return {
        baseBorrowRate: false,
        interestMultiplier: true,
      };
    } else if (interestMultiplier.length > 0) {
      return {
        baseBorrowRate: true,
        interestMultiplier: false,
      };
    } else {
      return {
        baseBorrowRate: false,
        interestMultiplier: false,
      };
    }
  }, [baseBorrowRate.length, interestMultiplier.length]);

  // ---------------------------------------------
  // callbacks
  // ---------------------------------------------
  const createMsgs = useCallback(
    (baseBorrowRate: string, interestMultiplier: string): ExecuteMsg[] => {
      const interestModelConfig: InterestModelUpdateConfig['update_config'] = {};

      if (interestMultiplier.length > 0) {
        interestModelConfig['base_rate'] = formatExecuteMsgNumber(
          big(baseBorrowRate).div(100).div(blocksPerYear),
        ) as Rate;
      }

      if (interestMultiplier.length > 0) {
        interestModelConfig['interest_multiplier'] = formatExecuteMsgNumber(
          interestMultiplier,
        ) as Rate;
      }

      const msgs: Omit<ExecuteMsg, 'order'>[] = [];

      if (Object.keys(interestModelConfig).length > 0) {
        msgs.push({
          contract: address.moneyMarket.interestModel,
          msg: Buffer.from(
            JSON.stringify({
              update_config: interestModelConfig,
            }),
          ).toString('base64'),
        });
      }

      return msgs.map((msg, i) => ({
        order: i + 1,
        ...msg,
      }));
    },
    [address.moneyMarket.interestModel, blocksPerYear],
  );

  // ---------------------------------------------
  // presentation
  // ---------------------------------------------
  return (
    <PollCreateBase
      pollTitle="Modify Borrow Interest"
      submitDisabled={
        baseBorrowRate.length === 0 && interestMultiplier.length === 0
      }
      onCreateMsgs={() => createMsgs(baseBorrowRate, interestMultiplier)}
    >
      <div className="description" aria-disabled={inputDisabled.baseBorrowRate}>
        <p>
          <IconSpan>
            Base Borrow Rate{' '}
            <InfoTooltip>
              Minimum per-block interest rate to borrowers
            </InfoTooltip>
          </IconSpan>
        </p>
        <p />
      </div>

      <NumberInput
        placeholder="0.00"
        maxIntegerPoinsts={3}
        maxDecimalPoints={8}
        InputProps={{
          endAdornment: <InputAdornment position="end">%</InputAdornment>,
        }}
        value={baseBorrowRate}
        disabled={inputDisabled.baseBorrowRate}
        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
          setBaseBorrowRate(target.value)
        }
      />

      <div
        className="description"
        aria-disabled={inputDisabled.interestMultiplier}
      >
        <p>
          <IconSpan>
            Interest Multiplier{' '}
            <InfoTooltip>
              Multiplier between utilization ratio and per-block borrow rate
            </InfoTooltip>
          </IconSpan>
        </p>
        <p />
      </div>

      <NumberInput
        placeholder="0.00"
        maxIntegerPoinsts={3}
        maxDecimalPoints={MAX_EXECUTE_MSG_DECIMALS}
        value={interestMultiplier}
        disabled={inputDisabled.interestMultiplier}
        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
          setInterestMultiplier(target.value)
        }
      />
    </PollCreateBase>
  );
}
