import { useState } from "react";
import { DollarSign, Users, Store, TrendingUp, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FranchiseeDashboard = () => {
  const navigate = useNavigate();
  // Este é um dashboard estático/placeholder. 
  // No futuro, os dados virão do Supabase filtrados pela cidade do franqueado.

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display font-bold text-xl text-primary">Painel do Franqueado</h1>
            <span className="hidden md:inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Aracaju - SE
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </Button>
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              F
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Visão Geral</h2>
            <p className="text-muted-foreground">Acompanhe o desempenho da sua franquia</p>
          </div>
          <Button>Gerar Relatório</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento (Mês)</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 45.231,89</div>
              <p className="text-xs text-success flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sua Comissão</CardTitle>
              <DollarSign className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">R$ 2.261,59</div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa de repasse: 5%
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estabelecimentos</CardTitle>
              <Store className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">124</div>
              <p className="text-xs text-success flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3 novos esta semana
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Entregadores Ativos</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground mt-1">
                Na sua região
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mais seções do Dashboard poderiam ir aqui */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-soft min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Gráfico de Vendas <br/> (Em breve)
            </p>
          </Card>
          <Card className="border-none shadow-soft min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Últimos Estabelecimentos Cadastrados <br/> (Em breve)
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FranchiseeDashboard;
