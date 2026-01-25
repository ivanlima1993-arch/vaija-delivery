import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Smartphone, Share, Plus, Check, ChefHat, Bike, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Install = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      console.log("App installed successfully");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <header className="p-4 text-center">
        <Link to="/" className="inline-block">
          <img 
            src={logo} 
            alt="Vai Já Delivery" 
            className="h-20 w-auto object-contain mx-auto animate-logo-pulse"
          />
        </Link>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Instale o Vai Já
          </h1>
          <p className="text-gray-600 text-lg">
            Tenha acesso rápido ao app direto da tela inicial do seu celular
          </p>
        </div>

        {/* Status Card */}
        {isInstalled ? (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">App já instalado!</h3>
                <p className="text-green-600 text-sm">
                  O Vai Já está pronto para uso na sua tela inicial
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isInstallable ? (
          <Card className="mb-8 border-orange-200">
            <CardContent className="p-6 text-center">
              <Button 
                onClick={handleInstall}
                size="lg" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6"
              >
                <Download className="w-5 h-5 mr-2" />
                Instalar Agora
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                Sem custo e sem usar espaço da loja de apps
              </p>
            </CardContent>
          </Card>
        ) : isIOS ? (
          <Card className="mb-8 border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg">Como instalar no iPhone/iPad</CardTitle>
              <CardDescription>Siga os passos abaixo para adicionar à tela inicial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Share className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">1. Toque em Compartilhar</p>
                  <p className="text-sm text-gray-500">Clique no ícone de compartilhar no Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">2. Adicionar à Tela de Início</p>
                  <p className="text-sm text-gray-500">Role para baixo e selecione esta opção</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">3. Confirmar</p>
                  <p className="text-sm text-gray-500">Toque em "Adicionar" no canto superior direito</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-gray-200">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                Acesse este site pelo navegador do seu celular para instalar o app
              </p>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-6">Um app para cada necessidade</h2>
          
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Para Clientes</h3>
                <p className="text-sm text-gray-500">
                  Peça comida e acompanhe em tempo real
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Bike className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Para Entregadores</h3>
                <p className="text-sm text-gray-500">
                  Receba pedidos e navegue até o destino
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Para Estabelecimentos</h3>
                <p className="text-sm text-gray-500">
                  Gerencie pedidos e cardápio facilmente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <p className="text-2xl font-bold text-orange-500">100%</p>
            <p className="text-sm text-gray-500">Gratuito</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <p className="text-2xl font-bold text-orange-500">0 MB</p>
            <p className="text-sm text-gray-500">Na loja de apps</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <p className="text-2xl font-bold text-orange-500">Offline</p>
            <p className="text-sm text-gray-500">Funciona sem internet</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <p className="text-2xl font-bold text-orange-500">Rápido</p>
            <p className="text-sm text-gray-500">Carrega instantâneo</p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link to="/" className="text-orange-600 hover:underline">
            ← Voltar para o site
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Install;
