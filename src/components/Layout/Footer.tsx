import { APP_CONFIG } from '@/constants';

const Footer = () => {
  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="text-sm text-gray-600">
        <div className="font-medium">{APP_CONFIG.NAME} v{APP_CONFIG.VERSION}</div>
        <div>{APP_CONFIG.COPYRIGHT}</div>
      </div>
    </div>
  )
}

export default Footer;
