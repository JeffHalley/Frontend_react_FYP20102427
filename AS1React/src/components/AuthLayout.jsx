// components/AuthLayout.jsx

export function createAuthComponents(onWikiClick) {
  return {
    Header() {
      return (
        <div className="text-center p-8 bg-surface-900 rounded-t-xl border-b border-surface-border">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Bedrock agentic <span className="text-brand-90">AI</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2 font-medium">By Jeff Halley</p>
          
          {/* Tidyed up button with better spacing */}
          <div className="mt-6 px-4"> 
            <button
              onClick={onWikiClick}
              className="
                group w-full py-2.5 px-4 rounded-lg 
                bg-brand-80 text-white text-xs font-bold uppercase tracking-wider
                flex items-center justify-center gap-2
                cursor-pointer transition-all duration-300 ease-out
                
                hover:bg-brand-70 
                hover:-translate-y-0.5 
                hover:shadow-lg hover:shadow-brand-80/20
                
                active:scale-[0.98] 
                active:translate-y-0
              "
            >
              <span>View Project Website</span>
              <span className="text-lg leading-none transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>
      );
    },
    Footer() {
      return (
        <div className="text-center p-4 bg-surface-800 rounded-b-xl flex flex-col items-center gap-3">
          <p className="text-xs text-text-muted italic">Auth securely powered by AWS Cognito</p>
        </div>
      );
    },
  };
}
export const authComponents = {
  Header() {
    return (
      <div className="text-center p-8 bg-surface-900 rounded-t-xl border-b border-surface-border">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          Bedrock agentic <span className="text-brand-90">AI</span>
        </h1>
        <p className="text-text-secondary text-sm mt-2 font-medium">By Jeff Halley</p>

      </div>
    );
  },
  Footer() {
    return (
      <div className="text-center p-4 bg-surface-800 rounded-b-xl">
        <p className="text-xs text-text-muted italic">Auth securely powered by AWS Cognito</p>
      </div>
    );
  },
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
  signUp: {
    email: {
      label: 'Email',
      placeholder: 'your@email.com',
      isRequired: true,
      order: 1,
    },
    password: {
      label: 'Password',
      placeholder: '',
      isRequired: true,
      order: 2,
    },
    confirm_password: {
      label: 'Confirm Password',
      placeholder: '',
      isRequired: true,
      order: 3,
    },
  },
};

export const authTheme = {
  name: 'auth-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: 'var(--color-brand-10)',
          80: 'var(--color-brand-80)',
          90: 'var(--color-brand-90)',
        },
      },
    },
    components: {
      authenticator: {
        router: {
          borderWidth: '0',
          backgroundColor: 'var(--color-surface-900)',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
        },
      },
      fieldcontrol: {
        _focus: {
          boxShadow: '0 0 0 2px var(--color-brand-80)',
          borderColor: 'var(--color-brand-80)',
        },
        color: 'var(--color-text-primary)',
        backgroundColor: 'var(--color-surface-700)',
        borderColor: 'var(--color-surface-border)',
      },
      tabs: {
        item: {
          _active: {
            color: 'var(--color-brand-90)',
            borderColor: 'var(--color-brand-90)',
          },
          color: 'var(--color-text-secondary)',
        },
      },
      button: {
        primary: {
          backgroundColor: 'var(--color-brand-80)',
          _hover: {
            backgroundColor: 'var(--color-brand-70)',
          },
        },
      },
    },
  },
};