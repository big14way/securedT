import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { colors } from '../theme/colors';

function ConnectButton({ size = 'large', buttonType = 'primary', text = 'Connect Wallet', connectOnMount = false }) {
  const buttonStyle = {
    backgroundColor: buttonType === 'primary' ? colors.primary : 'transparent',
    borderColor: colors.primary,
    color: buttonType === 'primary' ? colors.white : colors.primary,
    fontWeight: '600',
    padding: size === 'large' ? '8px 16px' : '4px 8px',
    borderRadius: '6px',
    border: `1px solid ${colors.primary}`,
    fontSize: size === 'large' ? '16px' : '14px',
  };

  return (
    <DynamicWidget
      variant="modal"
      buttonClassName="dynamic-connect-button"
      buttonContainerClassName="dynamic-button-container"
    />
  );
}

export default ConnectButton;
