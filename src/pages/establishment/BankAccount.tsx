import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EstablishmentSidebar from "@/components/establishment/EstablishmentSidebar";
import { Menu, Building2, CreditCard, User } from "lucide-react";
import { useEstablishment } from "@/hooks/useEstablishment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "104", name: "Caixa Econômica" },
  { code: "033", name: "Santander" },
  { code: "260", name: "Nubank" },
  { code: "077", name: "Inter" },
  { code: "336", name: "C6 Bank" },
];

const EstablishmentBankAccount = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { establishment, loading } = useEstablishment();
  const [bankCode, setBankCode] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [agency, setAgency] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderDocument, setHolderDocument] = useState("");
  const [pixKeyType, setPixKeyType] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (establishment) fetchBankAccount();
  }, [establishment]);

  const fetchBankAccount = async () => {
    const { data } = await supabase
      .from("establishment_bank_accounts")
      .select("*")
      .eq("establishment_id", establishment!.id)
      .maybeSingle();

    if (data) {
      setBankCode(data.bank_code || "");
      setAccountType(data.account_type || "checking");
      setAgency(data.agency || "");
      setAccountNumber(data.account_number || "");
      setHolderName(data.holder_name || "");
      setHolderDocument(data.holder_document || "");
      setPixKeyType(data.pix_key_type || "");
      setPixKey(data.pix_key || "");
    }
    setLoadingData(false);
  };

  const saveBankAccount = async () => {
    setSaving(true);
    const bank = BANKS.find((b) => b.code === bankCode);

    const payload = {
      establishment_id: establishment!.id,
      bank_code: bankCode,
      bank_name: bank?.name || "",
      account_type: accountType,
      agency,
      account_number: accountNumber,
      holder_name: holderName,
      holder_document: holderDocument,
      pix_key_type: pixKeyType,
      pix_key: pixKey,
    };

    const { data: existing } = await supabase
      .from("establishment_bank_accounts")
      .select("id")
      .eq("establishment_id", establishment!.id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from("establishment_bank_accounts").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("establishment_bank_accounts").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar dados bancários");
    } else {
      toast.success("Dados bancários salvos!");
    }
    setSaving(false);
  };

  const savePixKey = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from("establishment_bank_accounts")
      .select("id")
      .eq("establishment_id", establishment!.id)
      .maybeSingle();

    const payload = {
      establishment_id: establishment!.id,
      pix_key_type: pixKeyType,
      pix_key: pixKey,
    };

    let error;
    if (existing) {
      ({ error } = await supabase.from("establishment_bank_accounts").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("establishment_bank_accounts").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar chave PIX");
    } else {
      toast.success("Chave PIX salva!");
    }
    setSaving(false);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <EstablishmentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Conta Bancária</h1>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dados Bancários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Banco</label>
                  <Select value={bankCode} onValueChange={setBankCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Conta</label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Conta Corrente</SelectItem>
                      <SelectItem value="savings">Conta Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agência</label>
                  <Input value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="0000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conta</label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="00000-0" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados do Titular
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Nome do titular da conta" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF/CNPJ</label>
                  <Input value={holderDocument} onChange={(e) => setHolderDocument(e.target.value)} placeholder="000.000.000-00" />
                </div>
              </div>
              <Button className="w-full" onClick={saveBankAccount} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Dados Bancários"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Chave PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Chave</label>
                  <Select value={pixKeyType} onValueChange={setPixKeyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="random">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chave PIX</label>
                  <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Digite sua chave PIX" />
                </div>
              </div>
              <Button className="w-full" onClick={savePixKey} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Chave PIX"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentBankAccount;
