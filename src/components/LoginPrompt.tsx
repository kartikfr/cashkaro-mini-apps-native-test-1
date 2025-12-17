import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LoginPromptProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({
  title,
  description,
  icon: Icon = LogIn,
  className = '',
}) => {
  const navigate = useNavigate();

  return (
    <div className={`flex items-center justify-center min-h-[60vh] p-4 ${className}`}>
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground mb-6">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => navigate('/login')} 
            className="flex-1 sm:flex-initial"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login / Sign Up
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex-1 sm:flex-initial"
          >
            Browse Offers
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPrompt;
