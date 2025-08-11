import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  Database, 
  Brain, 
  Settings,
  Upload,
  Play,
  List
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { 
    name: 'Datasets', 
    icon: Database,
    children: [
      { name: 'All Datasets', href: '/datasets', icon: List },
      { name: 'Upload Dataset', href: '/datasets/upload', icon: Upload },
    ]
  },
  { 
    name: 'Training', 
    icon: Brain,
    children: [
      { name: 'Training Jobs', href: '/training', icon: List },
      { name: 'Start Training', href: '/training/start', icon: Play },
    ]
  },
  { name: 'Models', href: '/models', icon: Settings },
]

export const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div>
                <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </div>
                <div className="ml-6 space-y-1">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )
                      }
                    >
                      <child.icon className="mr-3 h-4 w-4" />
                      {child.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}