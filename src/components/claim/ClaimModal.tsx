import React, { useCallback, useState } from 'react'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonPrimary } from '../Button'
import { useActiveWeb3React } from '../../hooks'
import useUnclaimedSWPRBalance from '../../hooks/useUnclaimedSWPRBalance'
import useIsClaimAvailable from '../../hooks/useIsClaimAvailable'
import useClaimCallback from '../../hooks/useClaimCallback'
import { useShowClaimPopup } from '../../state/application/hooks'
import { transparentize } from 'polished'
import TransactionConfirmationModal from '../TransactionConfirmationModal'
import { TokenAmount } from 'dxswap-sdk'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const UpperAutoColumn = styled(AutoColumn)`
  padding: 24px;
  background-color: ${({ theme }) => transparentize(0.45, theme.bg2)};
  backdrop-filter: blur(12px);
`

const BottomAutoColumn = styled(AutoColumn)`
  width: 100%;
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 8px;
  padding: 26px;
`

export default function ClaimModal({
  onDismiss,
  swprBalance
}: {
  onDismiss: () => void
  swprBalance: TokenAmount | undefined
}) {
  const { account } = useActiveWeb3React()

  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const open = useShowClaimPopup()

  const claimCallback = useClaimCallback(account || undefined)
  const { unclaimedBalance } = useUnclaimedSWPRBalance(account || undefined)
  const { available: availableClaim } = useIsClaimAvailable(account || undefined)

  const onClaim = useCallback(() => {
    setAttempting(true)
    claimCallback()
      .then(transaction => {
        setHash(transaction.hash)
        transaction
          .wait()
          .then(() => {
            setAttempting(false)
          })
          .catch(() => {
            console.error('error submitting tx')
          })
      })
      .catch(error => {
        setAttempting(false)
        console.log(error)
      })
  }, [claimCallback])

  const wrappedOnDismiss = () => {
    setAttempting(false)
    setHash(undefined)
    onDismiss()
  }

  const content = () => {
    return (
      <ContentWrapper gap="lg">
        <UpperAutoColumn gap="16px">
          <RowBetween>
            <TYPE.white fontWeight={500} fontSize="20px" lineHeight="24px" color="text4">
              Your SWPR details
            </TYPE.white>
            <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} />
          </RowBetween>
          <TYPE.white fontWeight={700} fontSize={36}>
            {swprBalance ? swprBalance?.toFixed(3) : '0'}
          </TYPE.white>
          <TYPE.white fontWeight={600} fontSize="11px" lineHeight="13px" letterSpacing="0.08em" color="text4">
            TOTAL SWPR (INCLUDING UNCLAIMED
          </TYPE.white>
        </UpperAutoColumn>
        <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
          <BottomAutoColumn gap="8px">
            <TYPE.small fontWeight={600} fontSize="11px" lineHeight="13px" letterSpacing="0.08em" color="text5">
              UNCLAIMED SWPR
            </TYPE.small>
            <TYPE.white fontWeight={700} fontSize="22px" lineHeight="27px">
              {unclaimedBalance?.toFixed(3)} SWPR
            </TYPE.white>
            <ButtonPrimary
              disabled={!availableClaim}
              padding="16px 16px"
              width="100%"
              borderRadius="12px"
              mt="1rem"
              onClick={onClaim}
            >
              Claim SWPR
            </ButtonPrimary>
          </BottomAutoColumn>
          <TYPE.small fontSize="13px" fontWeight="400px" lineHeight="16px">
            Read about the airdrop
          </TYPE.small>
        </AutoColumn>
      </ContentWrapper>
    )
  }

  return (
    <TransactionConfirmationModal
      isOpen={open}
      onDismiss={onDismiss}
      attemptingTxn={attempting}
      hash={hash}
      content={content}
      pendingText={`Claiming ${unclaimedBalance?.toFixed(3)} SWPR`}
    />
  )
}