// components/AuthLayout.jsx
export const authComponents = {
  Header() {
    return (
      <div className="text-center p-8 bg-gray-900 rounded-t-xl border-b border-gray-700">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Bedrock agentic <span className="text-blue-500">AI</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2 font-medium">By Jeff Halley</p>
      </div>
    );
  },
  Footer() {
    return (
      <div className="text-center p-4 bg-gray-800 rounded-b-xl">
        <p className="text-xs text-gray-500 italic">Auth securely powered by AWS Cognito</p>
      </div>
    );
  }
};

export const authFormFields = {
  signIn: {
    username: {
      label: 'Email',
      placeholder: 'your@email.com',
      isRequired: true,
    },
    password: {
      label: 'Password',
      placeholder: '********',
      isRequired: true,
    },
  },
};

export const authTheme = {
  name: 'auth-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '{colors.blue.10}',
          80: '#3b82f6', // Tailwind blue-500
          90: '#2563eb', // Tailwind blue-600
        },
      },
    },
    components: {
      authenticator: {
        router: {
          borderWidth: '0',
          backgroundColor: '#1f2937', // bg-gray-800
        },
      },
      fieldcontrol: {
        _focus: {
          boxShadow: '0 0 0 2px #3b82f6', // blue focus ring
        },
        color: '#f3f4f6', // gray-100 text
        backgroundColor: '#374151', // bg-gray-700
      },
      tabs: {
        item: {
          _active: {
            color: '#3b82f6',
            borderColor: '#3b82f6',
          },
          color: '#9ca3af', // gray-400
        },
      },
    },
  },
};
