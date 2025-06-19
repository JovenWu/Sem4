import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  Shield,
  Zap,
  Users,
  ChevronDown,
} from "lucide-react";

export default function InventoryForecastingLanding() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Prediksi Akurat",
      description:
        "Algoritma AI canggih untuk prediksi inventory dengan akurasi hingga 95%",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics Real-time",
      description:
        "Dashboard interaktif dengan visualisasi data yang mudah dipahami",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Aman & Terpercaya",
      description:
        "Keamanan data tingkat enterprise dengan enkripsi end-to-end",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Otomatisasi Cerdas",
      description:
        "Sistem otomatis yang mengoptimalkan stok berdasarkan pola historis",
    },
  ];

  const stats = [
    { number: "95%", label: "Akurasi Prediksi" },
    { number: "500+", label: "Perusahaan Terpercaya" },
    { number: "2.5M+", label: "Transaksi Diproses" },
    { number: "24/7", label: "Support Available" },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Spline Background */}
      <div className="absolute inset-0 z-0">
        <iframe
          src="https://my.spline.design/unchained-qFOqhGI1z03EMwBJiYPmTX4h/"
          className="w-full h-full border-none"
          title="3D Background"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-32 pb-32">
        <div className="max-w-7xl mx-auto text-center">
          <div
            className={`transition-all duration-1500 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Smart Inventory
              </span>
              <br />
              <span className="text-white">Forecasting</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Implementasi Machine Learning untuk prediksi inventory yang
              presisi. Analisis pola data historis, optimasi algoritma, dan
              visualisasi hasil forecasting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-2xl">
                <span>Mulai Gratis</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button className="relative bg-white/10 backdrop-blur-sm border-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105 neon-border-animation">
                <style jsx>{`
                  .neon-border-animation {
                    animation: neon-border-cycle 4s infinite linear;
                  }

                  @keyframes neon-border-cycle {
                    0% {
                      border-color: #00ff88;
                      box-shadow: 0 0 15px rgba(0, 255, 136, 0.5),
                        inset 0 0 15px rgba(0, 255, 136, 0.1);
                    }
                    25% {
                      border-color: #00aaff;
                      box-shadow: 0 0 15px rgba(0, 170, 255, 0.5),
                        inset 0 0 15px rgba(0, 170, 255, 0.1);
                    }
                    50% {
                      border-color: #ff00ff;
                      box-shadow: 0 0 15px rgba(255, 0, 255, 0.5),
                        inset 0 0 15px rgba(255, 0, 255, 0.1);
                    }
                    75% {
                      border-color: #ffaa00;
                      box-shadow: 0 0 15px rgba(255, 170, 0, 0.5),
                        inset 0 0 15px rgba(255, 170, 0, 0.1);
                    }
                    100% {
                      border-color: #00ff88;
                      box-shadow: 0 0 15px rgba(0, 255, 136, 0.5),
                        inset 0 0 15px rgba(0, 255, 136, 0.1);
                    }
                  }
                `}</style>
                Lihat Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`text-center transition-all duration-1000 delay-${
                    (index + 1) * 200
                  } ${
                    isVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-10 opacity-0"
                  }`}
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-400" />
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 px-6 py-32 bg-gradient-to-b from-transparent to-gray-900/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Fitur Unggulan
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Teknologi terdepan untuk mengoptimalkan inventory management Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer"
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="text-blue-400 mb-6 group-hover:text-purple-400 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-blue-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
