import { 
  DollarSign, 
  FileSpreadsheet, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  BarChart3,
  PieChart,
  Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function LandingPage() {
  const navigate = useNavigate();
  const features = [
    {
      icon: FileSpreadsheet,
      title: 'Excel Integration',
      description: 'Import and export your budgets seamlessly with Excel spreadsheets. Keep your existing workflow while gaining powerful insights.'
    },
    {
      icon: TrendingUp,
      title: 'Smart Budget Tracking',
      description: 'Track income, deductions, and expenses with precision. Monitor your financial progress with real-time calculations.'
    },
    {
      icon: Clock,
      title: 'Recurring Templates',
      description: 'Set up recurring income and expense templates to save time. Create budgets faster with your personalized patterns.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your financial data is protected with enterprise-grade security. Only you can access your personal budget information.'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Get comprehensive insights into your spending patterns and financial habits with detailed breakdowns and summaries.'
    },
    {
      icon: Calculator,
      title: 'Expense Calculator',
      description: 'Built-in calculator tools help you plan expenses and track actual spending versus budgeted amounts.'
    }
  ];

  const benefits = [
    'Take control of your financial future',
    'Save hours with automated Excel imports',
    'Never miss a budget item with templates',
    'Make informed decisions with clear insights',
    'Access your budget anywhere, anytime',
    'South African Rand currency support'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-green-600 rounded-full shadow-lg">
                  <DollarSign className="h-12 w-12 text-white" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Balance <span className="text-green-600">Buddy</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                The smart budget planner that transforms how you manage your finances. 
                Track income, expenses, and savings with powerful Excel integration.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => navigate('/auth')}
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-green-600 text-green-600 hover:bg-green-50"
                >
                  Login
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                No credit card required • Free to start • Secure & Private
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything you need to master your finances
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Balance Buddy combines the familiarity of Excel with modern budgeting features, 
              giving you complete control over your financial planning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                      <feature.icon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why thousands choose Balance Buddy
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join users who have transformed their financial lives with our 
                intuitive budget planning platform designed for the modern world.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="border-2 border-gray-100 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Sample Budget Overview
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-700">Total Income</span>
                    <span className="font-bold text-green-600">R 25,500.00</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-red-700">Total Expenses</span>
                    <span className="font-bold text-red-600">R 18,750.00</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <span className="font-bold text-blue-700">Available Balance</span>
                    <span className="font-bold text-blue-600 text-lg">R 6,750.00</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center">
                  <PieChart className="h-8 w-8 text-gray-400 mr-2" />
                  <span className="text-gray-500 text-sm">Interactive charts and insights included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to take control of your finances?
          </h2>
          <p className="text-xl text-green-100 mb-10">
            Join thousands of users who have already transformed their financial lives. 
            Start your journey to financial freedom today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-white text-green-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Free Budget
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <div className="mt-8 text-green-200 text-sm">
            No spam, no hidden fees, cancel anytime
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Balance Buddy</h3>
            <p className="text-gray-400 mb-6">
              Your smart budget planning companion
            </p>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Balance Buddy. Built by <a href="https://www.linkedin.com/in/rikus-swart-68870b1b8/">Rikus Swart</a>. Inspired by Elzé and Francois Borman. 
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}