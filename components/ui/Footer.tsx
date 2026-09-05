// components/ui/Footer.tsx
import Link from 'next/link'
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube 
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-primary-400 mb-4">
              VentasYesStyle
            </h3>
            <p className="text-gray-400">
              Tu tienda online de moda y estilo. Encuentra los mejores productos 
              con la calidad y precio que mereces.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="font-semibold text-white mb-4">Enlaces</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/categoria/ropa" className="hover:text-white transition-colors">
                  Ropa
                </Link>
              </li>
              <li>
                <Link href="/categoria/accesorios" className="hover:text-white transition-colors">
                  Accesorios
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h4 className="font-semibold text-white mb-4">Síguenos</h4>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} VentasYesStyle. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}