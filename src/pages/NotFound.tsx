import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePlatform } from "@/hooks/usePlatform";

const NotFound = () => {
  const location = useLocation();
  const { isNative } = usePlatform();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-muted"
      style={isNative ? {
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      } : undefined}
    >
      <div className="text-center px-4">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
