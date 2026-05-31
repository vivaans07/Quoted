import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

import { C } from './src/theme';
import { Store } from './src/storage';
import * as Cloud from './src/cloud';
import * as Billing from './src/purchases';
import { generateEstimate } from './src/api';
import type { Company, Customer, Quote, Estimate } from './src/types';
import type { TabId } from './src/components/Chrome';

import { Auth } from './src/screens/Auth';
import { Onboarding } from './src/screens/onboarding/Onboarding';
import { Dashboard } from './src/screens/Dashboard';
import { NewQuote } from './src/screens/NewQuote';
import { GenerateLoading } from './src/screens/Loading';
import { EstimateReview } from './src/screens/Review';
import { QuotesTab, CustomersTab, SettingsTab } from './src/screens/Tabs';
import { QuoteDetail } from './src/screens/QuoteDetail';
import { EditProfile } from './src/screens/EditProfile';
import { Toast, ToastData } from './src/components/Toast';
import { CustomerSheet, SendSheet } from './src/components/Sheets';
import { SuccessBurst } from './src/components/SuccessBurst';
import { Paywall } from './src/components/Paywall';

SplashScreen.preventAutoHideAsync().catch(() => {});

type AppView = TabId | 'newquote' | 'loading' | 'review' | 'detail' | 'editprofile';

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, DMSans_800ExtraBold,
    JetBrainsMono_500Medium, JetBrainsMono_700Bold,
  });

  // 'loading' while checking Supabase session; 'auth' = no session; 'ok' = authenticated (or local-only)
  const [authState, setAuthState] = useState<'loading' | 'auth' | 'ok'>(
    Cloud.cloudEnabled ? 'loading' : 'ok',
  );

  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const [view, setView] = useState<AppView>('dashboard');
  const [prevTab, setPrevTab] = useState<TabId>('dashboard');
  const [draft, setDraft] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [resendId, setResendId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastData | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [success, setSuccess] = useState<{ show: boolean; channel: string }>({ show: false, channel: '' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth gate — subscribe to session changes; resolve initial state immediately.
  useEffect(() => {
    if (!Cloud.cloudEnabled) return; // local-only mode, already set to 'ok'
    const unsub = Cloud.onAuthChange((session) => {
      setAuthState(session ? 'ok' : 'auth');
    });
    Cloud.getSession().then((session) => {
      setAuthState(session ? 'ok' : 'auth');
    });
    return unsub;
  }, []);

  // RevenueCat — configure once, tie the customer to the signed-in user, and
  // keep `isPro` in sync with entitlement changes. No-op when billing is off.
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      await Billing.init();
      const session = await Cloud.getSession();
      if (session?.user?.id) await Billing.identify(session.user.id);
      setIsPro(await Billing.isPro());
      unsub = Billing.onProChange(setIsPro);
    })();
    return () => unsub();
  }, []);

  // initial load — runs once auth is resolved so cloud pull uses the correct user
  useEffect(() => {
    if (authState === 'loading') return;
    (async () => {
      const [co, cu, qu] = await Promise.all([Store.loadCompany(), Store.loadCustomers(), Store.loadQuotes()]);
      setCompany(co); setCustomers(cu);
      // Sync any quotes that were opened by customers since last session.
      const synced = await Store.syncOpenedStatus(qu);
      setQuotes(synced ?? qu);
      setReady(true);
      setTimeout(() => setFeedLoading(false), 900);
    })();
  }, [authState]);

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, ready]);

  const showToast = (msg: string, tone: 'success' | 'muted' = 'muted') => {
    setToast({ msg, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  };

  const persistQuotes = (next: Quote[]) => { setQuotes(next); Store.saveQuotes(next); };
  const persistCustomers = (next: Customer[]) => { setCustomers(next); Store.saveCustomers(next); };

  const finishOnboarding = async (c: Company) => {
    setCompany(c);
    await Store.saveCompany(c);
    setView('dashboard');
  };

  const startNewQuote = (preset?: Customer) => {
    setCustomer(preset ?? null);
    setDraft('');
    setView('newquote');
  };

  const customerById = (id: string) => customers.find((x) => x.id === id) ?? null;

  const openQuote = (q: Quote) => {
    setActiveQuoteId(q.id);
    if (view === 'dashboard' || view === 'quotes' || view === 'customers' || view === 'settings') setPrevTab(view);
    setView('detail');
  };

  const resendQuote = (q: Quote) => {
    if (!q.estimate) return;
    setEstimate(q.estimate);
    setCustomer(customerById(q.customerId));
    setResendId(q.id);
    setSendOpen(true);
  };

  const saveProfile = async (c: Company) => {
    setCompany(c);
    await Store.saveCompany(c);
    setView('settings');
  };

  const generate = async (text: string) => {
    setDraft(text);
    setView('loading');
    const minDelay = new Promise((r) => setTimeout(r, 4600));
    const [{ estimate: est }] = await Promise.all([generateEstimate(text, company!), minDelay]);
    setEstimate(est);
    setView('review');
  };

  const onSent = (channel: string, shareId: string) => {
    setSendOpen(false);

    // Resend path — update the existing quote instead of creating a new one.
    if (resendId) {
      const id = resendId;
      setResendId(null);
      const updatedQuotes = quotes.map((q) =>
        q.id === id
          ? { ...q, status: q.status === 'won' || q.status === 'lost' ? q.status : 'sent' as const, sentAt: 'Re-sent just now', shareId }
          : q,
      );
      persistQuotes(updatedQuotes);
      const resent = updatedQuotes.find((q) => q.id === id);
      if (resent) {
        Cloud.createShare({
          shareId, quoteId: id, estimate: estimate!, customerName: customer?.name,
          companyName: company!.name, companyPhone: company!.phone, companyOwner: company!.owner,
        });
      }
      setSuccess({ show: true, channel });
      setTimeout(() => {
        setSuccess({ show: false, channel: '' });
        showToast('Estimate re-sent', 'success');
      }, 2100);
      return;
    }

    let cust = customer;
    if (!cust) {
      cust = { id: 'c' + Date.now(), name: 'New customer', phone: '', email: '', address: '', initials: 'NEW' };
      persistCustomers([cust, ...customers]);
    }
    const total = estimate!.total_estimate;
    const nq: Quote = {
      id: 'q' + Date.now(),
      customerId: cust.id,
      job: estimate!.job_summary.split(/[,.]/)[0].slice(0, 40),
      type: 'New',
      amount: total,
      status: 'sent',
      sentAt: 'Sent just now',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      estimate: estimate!,
      shareId,
    };
    persistQuotes([nq, ...quotes]);
    // Persist the share record so the customer page link is live immediately.
    Cloud.createShare({
      shareId, quoteId: nq.id, estimate: estimate!, customerName: cust.name,
      companyName: company!.name, companyPhone: company!.phone, companyOwner: company!.owner,
    });

    setSuccess({ show: true, channel });
    setTimeout(() => {
      setSuccess({ show: false, channel: '' });
      setView('dashboard');
      showToast(`Estimate sent to ${cust!.name}`, 'success');
    }, 2100);
  };

  const markStatus = (id: string, status: 'won' | 'lost') => {
    persistQuotes(quotes.map((q) => (q.id === id ? { ...q, status, sentAt: status === 'won' ? 'Won just now' : 'Lost just now' } : q)));
    showToast(status === 'won' ? 'Marked as Won' : 'Marked as Lost', status === 'won' ? 'success' : 'muted');
  };

  const updateQuote = (id: string, patch: Partial<Quote>) => {
    persistQuotes(quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const resetApp = async () => {
    await Store.resetAll();
    const [co, cu, qu] = await Promise.all([Store.loadCompany(), Store.loadCustomers(), Store.loadQuotes()]);
    setCompany(co); setCustomers(cu); setQuotes(qu); setView('dashboard');
  };

  const stats = {
    open: quotes.filter((q) => q.status === 'sent' || q.status === 'opened' || q.status === 'accepted').length,
    won: quotes.filter((q) => q.status === 'won').length,
    revenue: quotes.filter((q) => q.status !== 'lost').reduce((s, q) => s + q.amount, 0),
  };

  if (!fontsLoaded || authState === 'loading') {
    return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  }

  if (authState === 'auth') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Auth onDone={() => {}} />
      </SafeAreaProvider>
    );
  }

  if (!ready || !company) {
    return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  }

  if (!company.onboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Onboarding onDone={finishOnboarding} />
      </SafeAreaProvider>
    );
  }

  const onNav = (t: TabId) => setView(t);
  const activeQuote = quotes.find((q) => q.id === activeQuoteId) ?? null;

  let body: React.ReactNode = null;
  if (view === 'dashboard') {
    body = (
      <Dashboard
        quotes={quotes} customers={customers} loading={feedLoading} stats={stats}
        onNewQuote={() => startNewQuote()} onOpenQuote={openQuote}
        onNav={onNav} onViewAll={() => setView('quotes')} onMark={markStatus} onBell={() => showToast('No new notifications')}
      />
    );
  } else if (view === 'quotes') {
    body = <QuotesTab quotes={quotes} customers={customers} onNav={onNav} onOpenQuote={openQuote} onNewQuote={() => startNewQuote()} />;
  } else if (view === 'customers') {
    body = <CustomersTab customers={customers} quotes={quotes} onNav={onNav} onNewQuoteFor={(c) => startNewQuote(c)} />;
  } else if (view === 'settings') {
    body = <SettingsTab company={company} quotes={quotes} onNav={onNav} onReset={resetApp} onEditProfile={() => setView('editprofile')} isPro={isPro} onUpgrade={() => setPaywallOpen(true)} />;
  } else if (view === 'detail' && activeQuote) {
    body = (
      <QuoteDetail
        quote={activeQuote} customer={customerById(activeQuote.customerId)} company={company}
        onBack={() => setView(prevTab)} onMark={markStatus} onResend={resendQuote} onToast={(m) => showToast(m)}
        onUpdate={updateQuote}
      />
    );
  } else if (view === 'editprofile') {
    body = <EditProfile company={company} onBack={() => setView('settings')} onSave={saveProfile} onToast={(m) => showToast(m)} />;
  } else if (view === 'newquote') {
    body = (
      <NewQuote
        customer={customer} draft={draft} onBack={() => setView('dashboard')}
        onPickCustomer={() => setPickerOpen(true)} onGenerate={generate}
        onDraftChange={setDraft} onToast={(m) => showToast(m)}
      />
    );
  } else if (view === 'loading') {
    body = <GenerateLoading jobText={draft || 'Trade service job'} />;
  } else if (view === 'review' && estimate) {
    body = (
      <EstimateReview
        estimate={estimate} customer={customer} onBack={() => setView('newquote')}
        onSend={() => setSendOpen(true)} onChange={setEstimate} onToast={(m) => showToast(m)}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {body}
        <Toast toast={toast} />
        <CustomerSheet
          visible={pickerOpen} customers={customers}
          onClose={() => setPickerOpen(false)}
          onPick={(c) => {
            if (!customers.some((x) => x.id === c.id)) persistCustomers([c, ...customers]);
            setCustomer(c);
            setPickerOpen(false);
          }}
        />
        <SendSheet
          visible={sendOpen} estimate={estimate} customer={customer} company={company}
          onClose={() => setSendOpen(false)} onSent={onSent}
        />
        <SuccessBurst visible={success.show} channel={success.channel} />
        <Paywall
          visible={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          onPurchased={() => setIsPro(true)}
          onToast={(m) => showToast(m, 'success')}
        />
      </View>
    </SafeAreaProvider>
  );
}
