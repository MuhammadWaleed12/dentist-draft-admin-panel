import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

const PhoneField = ({ ...rest }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <PhoneInput
        country={'us'}
        enableSearch={true}
        prefix="+"
        enableAreaCodes={true}
        inputStyle={{
          width: '100%',
          height: '48px',
          fontSize: '16px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          paddingLeft: '58px', // More space for country code and +
          ...rest.inputStyle, // Allow override from parent
        }}
        containerStyle={{
          width: '100%',
          ...rest.containerStyle, // Allow override from parent
        }}
        buttonStyle={{
          border: '1px solid #d1d5db',
          borderRadius: '6px 0 0 6px',
          backgroundColor: '#f9fafb',
          width: '50px', // Fixed width for country selector
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...rest.buttonStyle, // Allow override from parent
        }}
        dropdownStyle={{
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          zIndex: 1000,
          ...rest.dropdownStyle, // Allow override from parent
        }}
        {...rest}
      />
    </div>
  );
};

export default PhoneField;