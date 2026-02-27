import React, { Component } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from './ui/Button';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service here
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-gray-500 mb-6">
                            An unexpected error occurred in this module. The application caught it before crashing completely.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-lg text-left overflow-auto mb-6 max-h-32 text-xs font-mono text-gray-600 border border-gray-200">
                            {this.state.error && this.state.error.toString()}
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="primary"
                            >
                                Reload App
                            </Button>
                            <Button
                                onClick={() => window.location.href = '/'}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" /> Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
