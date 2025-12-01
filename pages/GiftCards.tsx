
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { ViewToggle } from '../components/ViewToggle';
import { ViewMode, loadViewMode, saveViewMode, PAGE_IDS, DEFAULT_VIEW_MODE } from '../utils/viewMode';
import { Gift, Plus, Printer, Trash2, Search, Download, Calendar, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { GiftCard } from '../types';
import { GIFT_CARD_THEMES } from '../constants';
import { generateUUID } from '../services/supabase/client';
import html2canvas from 'html2canvas';

export const GiftCards: React.FC = () => {
  const { giftCards, t, addGiftCard, deleteGiftCard, settings, hasPermission, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Form State
  const [createAmount, setCreateAmount] = useState<number>(5000);
  const [createTheme, setCreateTheme] = useState<keyof typeof GIFT_CARD_THEMES>('standard');
  const [createQty, setCreateQty] = useState<number>(1);
  const [createExpiry, setCreateExpiry] = useState<string>(''); // YYYY-MM-DD

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 20;

  // View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  
  // Load view mode from Supabase on mount
  useEffect(() => {
    const loadMode = async () => {
      if (settings?.shopId && currentUser?.id) {
        const mode = await loadViewMode(PAGE_IDS.GIFT_CARDS, settings.shopId, currentUser.id);
        setViewMode(mode);
      } else {
        const mode = await loadViewMode(PAGE_IDS.GIFT_CARDS);
        setViewMode(mode);
      }
    };
    loadMode();
  }, [settings?.shopId, currentUser?.id]);
  
  // Save view mode to Supabase
  useEffect(() => {
    if (settings?.shopId && currentUser?.id && viewMode !== DEFAULT_VIEW_MODE) {
      saveViewMode(PAGE_IDS.GIFT_CARDS, viewMode, settings.shopId, currentUser.id);
    }
  }, [viewMode, settings?.shopId, currentUser?.id]);

  // Refs for download
  const cardRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Reset pagination on search
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm]);

  if (!hasPermission('manage_gift_cards')) {
      return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <Gift className="w-16 h-16 mb-4 opacity-20" />
              <p>You do not have permission to manage gift cards.</p>
          </div>
      );
  }

  const filteredCards = (giftCards || []).filter(c => 
     c.code.toLowerCase().includes(searchTerm.toLowerCase())
  ).reverse();

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const displayedCards = filteredCards.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);

  const handleCreate = () => {
     for (let i = 0; i < createQty; i++) {
        // Generate pseudo-random code
        const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + 
                     Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + 
                     Math.random().toString(36).substring(2, 6).toUpperCase();
        
        const newCard: GiftCard = {
            id: generateUUID(),
            shopId: settings?.shopId || '',
            code,
            initialValue: createAmount,
            balance: createAmount,
            status: 'active',
            theme: createTheme,
            createdAt: new Date().toISOString(),
            expiresAt: createExpiry ? new Date(createExpiry).toISOString() : undefined
        };
        addGiftCard(newCard);
     }
     setShowModal(false);
     setCreateExpiry('');
  };

  const downloadCardImage = async (card: GiftCard) => {
    const element = cardRefs.current[card.id];
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 3, // Very High resolution for crisp printing
            useCORS: true,
            backgroundColor: null,
            logging: false,
            // Force specific rendering options to fix cut-off text and shifting
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(`card-${card.id}`);
                if (clonedElement) {
                    clonedElement.style.transform = 'none';
                    
                    // Fix Business Name Cut-off
                    const bizNameContainer = clonedElement.querySelector('.biz-name-container') as HTMLElement;
                    const bizNameText = clonedElement.querySelector('.biz-name-text') as HTMLElement;
                    
                    if (bizNameContainer) {
                        bizNameContainer.style.maxWidth = 'none'; // Remove width constraint
                        bizNameContainer.style.width = '100%';
                    }
                    if (bizNameText) {
                        bizNameText.style.whiteSpace = 'nowrap';
                        bizNameText.style.overflow = 'visible';
                        bizNameText.style.textOverflow = 'clip';
                        bizNameText.style.fontSize = '18px'; // Enforce readable size for desktop print
                    }

                    // Fix Label Shifting
                    const labelContainer = clonedElement.querySelector('.card-label-container') as HTMLElement;
                    if (labelContainer) {
                        labelContainer.style.top = '16px'; // Hardcode top position (4 * 4px)
                        labelContainer.style.right = '16px';
                    }

                    // Normalize fonts
                    const texts = clonedElement.querySelectorAll('*');
                    texts.forEach((el: any) => {
                        el.style.fontVariant = 'normal';
                    });
                }
            }
        });

        const link = document.createElement('a');
        link.download = `GiftCard-${card.code}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error("Failed to download image", err);
        alert("Failed to generate image.");
    }
  };

  const printCard = (card: GiftCard) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    // Get theme colors for print css inline styles
    const bgGradient = card.theme === 'gold' ? 'linear-gradient(135deg, #fcd34d 0%, #d97706 100%)' :
                       card.theme === 'festive' ? 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)' :
                       card.theme === 'dark' ? 'linear-gradient(135deg, #1f2937 0%, #000000 100%)' :
                       'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)';
    
    // Stripe overlay using SVG background for reliability
    const stripeOverlay = (card.theme === 'standard' || card.theme === 'dark') 
        ? `background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");`
        : '';

    const textColor = '#ffffff';
    
    // Date format
    const expiryDate = card.expiresAt 
        ? new Date(card.expiresAt).toLocaleDateString(undefined, {month:'2-digit', year:'2-digit'})
        : 'NO EXP';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
           <title>Gift Card - ${card.code}</title>
           <style>
              body { margin: 0; padding: 40px; font-family: 'Courier New', monospace; display: flex; justify-content: center; background: #f0f0f0; }
              .card {
                 width: 85.6mm; /* ISO ID-1 width */
                 height: 45mm; /* Slimmer height */
                 border-radius: 4mm;
                 background: ${bgGradient};
                 position: relative;
                 box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                 overflow: hidden;
                 color: ${textColor};
                 display: flex;
                 flex-direction: column;
                 justify-content: space-between;
                 padding: 5mm;
                 box-sizing: border-box;
              }
              .stripes {
                 position: absolute; top:0; left:0; right:0; bottom:0;
                 ${stripeOverlay}
                 z-index: 0;
              }
              .content { z-index: 1; position: relative; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
              .header { display: flex; justify-content: space-between; align-items: start; }
              .logo { font-size: 14pt; font-weight: bold; letter-spacing: 1px; font-family: sans-serif; text-transform: uppercase; }
              .label { font-size: 8pt; font-weight: bold; opacity: 0.8; }
              
              .code-wrapper {
                 flex: 1;
                 display: flex;
                 align-items: center;
                 justify-content: center;
              }
              
              .code {
                 font-size: 14pt;
                 font-family: 'Courier New', monospace;
                 font-weight: bold;
                 text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                 letter-spacing: 2px;
                 text-align: center;
              }

              .footer { display: flex; justify-content: space-between; align-items: flex-end; font-family: sans-serif; }
              .balance-label { font-size: 7pt; opacity: 0.7; text-transform: uppercase; }
              .balance { font-size: 14pt; font-weight: bold; }
              .expiry { font-size: 8pt; opacity: 0.8; }

              @media print { 
                  body { background: white; padding: 0; }
                  .card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
           </style>
        </head>
        <body>
           <div class="card">
              <div class="stripes"></div>
              <div class="content">
                  <div class="header">
                      <div class="logo">${settings.businessName}</div>
                      <div class="label">GIFT CARD</div>
                  </div>

                  <div class="code-wrapper">
                      <div class="code">${card.code}</div>
                  </div>

                  <div class="footer">
                      <div class="expiry">
                          VALID THRU<br/>${expiryDate}
                      </div>
                      <div style="text-align: right;">
                          <div class="balance-label">Initial Value</div>
                          <div class="balance">${settings.currency}${card.initialValue.toLocaleString()}</div>
                      </div>
                  </div>
              </div>
           </div>
           <script>window.onload = function() { setTimeout(function(){ window.print(); }, 500); }</script>
        </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // SVG Data URI for Stripes (Raw string for IMG tag)
  const stripeSvg = "data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E";

  return (
    <div className="space-y-6 pb-20">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Gift className="w-6 h-6 text-green-600" />
             {t('giftCards')}
           </h2>
           <p className="text-gray-500 text-sm">Create and manage digital gift cards</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
             <input
               className="w-full bg-white border border-gray-200 rounded-xl px-4 pl-9 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
               placeholder="Search code..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} className="hidden sm:flex" />
          <Button onClick={() => setShowModal(true)} className="whitespace-nowrap shadow-lg shadow-green-100 bg-green-600 hover:bg-green-700">
             <Plus className="w-5 h-5 mr-1" />
             <span className="hidden sm:inline">{t('createGiftCard')}</span>
          </Button>
        </div>
      </div>

      <div className="transition-all duration-300 animate-in fade-in">
        {displayedCards.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            <Gift className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No gift cards found</p>
          </div>
        ) : (
          <>
            {/* Small Icons View */}
            {viewMode === 'small' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {displayedCards.map(card => {
                  const themeClass = GIFT_CARD_THEMES[card.theme];
                  const isExpired = card.expiresAt ? new Date(card.expiresAt) < new Date() : false;
                  const isActive = card.status === 'active' && card.balance > 0 && !isExpired;
                  return (
                    <div key={card.id} className={`relative ${!isActive ? 'opacity-70 grayscale' : ''}`}>
                      <div id={`card-${card.id}`} ref={el => cardRefs.current[card.id] = el}>
                        <div className={`relative w-full aspect-[2/1] rounded-lg overflow-hidden shadow-md bg-gray-900 text-white`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${themeClass}`}></div>
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20"></div>
                          <div className="relative h-full w-full z-10 flex items-center justify-center">
                            <p className="font-mono text-xs font-bold tracking-wider drop-shadow-md">{card.code}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-[10px] font-bold text-gray-700">{settings.currency}{card.balance.toLocaleString()}</p>
                        <p className={`text-[9px] ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {isExpired ? 'Expired' : (card.balance <= 0 ? 'Empty' : 'Active')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Large Icons View (Current) */}
            {viewMode === 'large' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {displayedCards.map(card => {
                  const themeClass = GIFT_CARD_THEMES[card.theme];
                  const isExpired = card.expiresAt ? new Date(card.expiresAt) < new Date() : false;
                  const isActive = card.status === 'active' && card.balance > 0 && !isExpired;
                  return (
                    <div key={card.id} className={`relative group perspective-1000 ${!isActive ? 'opacity-70 grayscale' : ''}`}>
                      <div id={`card-${card.id}`} ref={el => cardRefs.current[card.id] = el}>
                        <div className={`relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-2xl transform transition-transform hover:scale-[1.02] duration-300 bg-gray-900 text-white`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${themeClass}`}></div>
                          {(card.theme === 'standard' || card.theme === 'dark') && (
                            <img src={stripeSvg} className="absolute inset-0 w-full h-full object-cover opacity-100 pointer-events-none" alt="" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none"></div>
                          <div className="relative h-full w-full z-10">
                            <div className="absolute top-4 left-4 max-w-[55%] biz-name-container">
                              <h3 className="font-bold text-sm sm:text-lg tracking-wider uppercase font-sans drop-shadow-md leading-none truncate block biz-name-text">
                                {settings.businessName}
                              </h3>
                            </div>
                            <div className="absolute top-4 right-4 card-label-container">
                              <span className="text-[9px] sm:text-[10px] font-bold border border-white/30 px-2 py-1 rounded backdrop-blur-sm leading-none inline-block">
                                GIFT CARD
                              </span>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="font-mono text-lg sm:text-2xl font-bold tracking-widest drop-shadow-md tabular-nums text-center leading-none">
                                {card.code}
                              </p>
                            </div>
                            <div className="absolute bottom-4 left-4 text-[9px] sm:text-[10px] opacity-80 leading-tight">
                              <p className="font-light">VALID THRU</p>
                              <p className="font-bold">
                                {card.expiresAt 
                                  ? new Date(card.expiresAt).toLocaleDateString(undefined, {month:'2-digit', year:'2-digit'})
                                  : 'NO EXP'
                                }
                              </p>
                            </div>
                            <div className="absolute bottom-4 right-4 text-right leading-tight">
                              <p className="text-[9px] sm:text-[10px] opacity-80 font-bold">BALANCE</p>
                              <p className="text-lg sm:text-xl font-bold tabular-nums">
                                {settings.currency}{card.balance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center px-2">
                        <div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isExpired ? 'Expired' : (card.balance <= 0 ? 'Empty' : 'Active')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => downloadCardImage(card)} className="p-2 bg-white hover:bg-blue-50 text-blue-600 rounded-full shadow-sm border border-gray-200 transition-all" title="Download Image">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => printCard(card)} className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-full shadow-sm border border-gray-200 transition-all" title="Print">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteGiftCard(card.id)} className="p-2 bg-white hover:bg-red-50 text-red-500 rounded-full shadow-sm border border-gray-200 transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {displayedCards.map(card => {
                  const themeClass = GIFT_CARD_THEMES[card.theme];
                  const isExpired = card.expiresAt ? new Date(card.expiresAt) < new Date() : false;
                  const isActive = card.status === 'active' && card.balance > 0 && !isExpired;
                  return (
                    <div key={card.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4">
                      <div className="w-32 flex-shrink-0">
                        <div id={`card-${card.id}`} ref={el => cardRefs.current[card.id] = el}>
                          <div className={`relative w-full aspect-[2/1] rounded-lg overflow-hidden shadow-md bg-gray-900 text-white ${!isActive ? 'opacity-70 grayscale' : ''}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${themeClass}`}></div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20"></div>
                            <div className="relative h-full w-full z-10 flex items-center justify-center">
                              <p className="font-mono text-xs font-bold tracking-wider drop-shadow-md">{card.code}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm mb-1">Code: {card.code}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Initial: {settings.currency}{card.initialValue.toLocaleString()}</span>
                          <span>Balance: {settings.currency}{card.balance.toLocaleString()}</span>
                          {card.expiresAt && (
                            <span>Expires: {new Date(card.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isExpired ? 'Expired' : (card.balance <= 0 ? 'Empty' : 'Active')}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => downloadCardImage(card)} className="p-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-gray-200" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => printCard(card)} className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors border border-gray-200" title="Print">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteGiftCard(card.id)} className="p-2 bg-white hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-gray-200" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Details View */}
            {viewMode === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayedCards.map(card => {
                  const themeClass = GIFT_CARD_THEMES[card.theme];
                  const isExpired = card.expiresAt ? new Date(card.expiresAt) < new Date() : false;
                  const isActive = card.status === 'active' && card.balance > 0 && !isExpired;
                  return (
                    <div key={card.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                      <div className={`relative group perspective-1000 ${!isActive ? 'opacity-70 grayscale' : ''}`}>
                        <div id={`card-${card.id}`} ref={el => cardRefs.current[card.id] = el}>
                          <div className={`relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-2xl bg-gray-900 text-white mb-4`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${themeClass}`}></div>
                            {(card.theme === 'standard' || card.theme === 'dark') && (
                              <img src={stripeSvg} className="absolute inset-0 w-full h-full object-cover opacity-100 pointer-events-none" alt="" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none"></div>
                            <div className="relative h-full w-full z-10">
                              <div className="absolute top-4 left-4 max-w-[55%] biz-name-container">
                                <h3 className="font-bold text-sm sm:text-lg tracking-wider uppercase font-sans drop-shadow-md leading-none truncate block biz-name-text">
                                  {settings.businessName}
                                </h3>
                              </div>
                              <div className="absolute top-4 right-4 card-label-container">
                                <span className="text-[9px] sm:text-[10px] font-bold border border-white/30 px-2 py-1 rounded backdrop-blur-sm leading-none inline-block">
                                  GIFT CARD
                                </span>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <p className="font-mono text-lg sm:text-2xl font-bold tracking-widest drop-shadow-md tabular-nums text-center leading-none">
                                  {card.code}
                                </p>
                              </div>
                              <div className="absolute bottom-4 left-4 text-[9px] sm:text-[10px] opacity-80 leading-tight">
                                <p className="font-light">VALID THRU</p>
                                <p className="font-bold">
                                  {card.expiresAt 
                                    ? new Date(card.expiresAt).toLocaleDateString(undefined, {month:'2-digit', year:'2-digit'})
                                    : 'NO EXP'
                                  }
                                </p>
                              </div>
                              <div className="absolute bottom-4 right-4 text-right leading-tight">
                                <p className="text-[9px] sm:text-[10px] opacity-80 font-bold">BALANCE</p>
                                <p className="text-lg sm:text-xl font-bold tabular-nums">
                                  {settings.currency}{card.balance.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Initial Value</span>
                          <span className="font-bold text-gray-800">{settings.currency}{card.initialValue.toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Current Balance</span>
                          <span className="font-bold text-gray-800">{settings.currency}{card.balance.toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Status</span>
                          <span className={`font-bold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {isExpired ? 'Expired' : (card.balance <= 0 ? 'Empty' : 'Active')}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Theme</span>
                          <span className="font-bold text-gray-800 capitalize">{card.theme}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-dashed border-gray-100">
                        <button onClick={() => downloadCardImage(card)} className="flex-1 px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 rounded-xl transition-colors border border-gray-200 flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-semibold">Download</span>
                        </button>
                        <button onClick={() => printCard(card)} className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-xl transition-colors border border-gray-200 flex items-center justify-center gap-2">
                          <Printer className="w-4 h-4" />
                          <span className="text-sm font-semibold">Print</span>
                        </button>
                        <button onClick={() => deleteGiftCard(card.id)} className="px-4 py-2 bg-white hover:bg-red-50 text-red-500 rounded-xl transition-colors border border-gray-200" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
              <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
              >
                  <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-600">
                  Page {currentPage} of {totalPages}
              </span>
              <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
              >
                  <ChevronRight className="w-5 h-5" />
              </button>
          </div>
      )}

      {/* Creation Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
             <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-gray-800">{t('createGiftCard')}</h3>
                </div>
                
                <div className="p-6 space-y-8">
                    {/* Live Preview of New Card */}
                    <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-2xl transform scale-100 origin-center bg-gray-900 text-white">
                        <div className={`absolute inset-0 bg-gradient-to-br ${GIFT_CARD_THEMES[createTheme]}`}></div>
                        
                        {(createTheme === 'standard' || createTheme === 'dark') && (
                            <img src={stripeSvg} className="absolute inset-0 w-full h-full object-cover opacity-100 pointer-events-none" alt="" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20"></div>

                        {/* Content using Absolute Positioning for Stability */}
                        <div className="relative h-full w-full z-10">
                            {/* Top Left */}
                            <div className="absolute top-4 left-4 max-w-[55%] biz-name-container">
                                <h3 className="font-bold text-sm sm:text-lg tracking-wider uppercase leading-none truncate block biz-name-text">
                                    {settings.businessName}
                                </h3>
                            </div>
                            
                            {/* Top Right */}
                            <div className="absolute top-4 right-4">
                                <span className="text-[9px] sm:text-[10px] font-bold border border-white/30 px-2 py-1 rounded backdrop-blur-sm leading-none inline-block">
                                    GIFT CARD
                                </span>
                            </div>
                            
                            {/* Center */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="font-mono text-lg sm:text-2xl font-bold tracking-widest drop-shadow-md text-center leading-none">
                                    XXXX-XXXX-XXXX
                                </p>
                            </div>

                            {/* Bottom Left */}
                            <div className="absolute bottom-4 left-4 text-[9px] sm:text-[10px] opacity-80 leading-tight">
                                <p className="font-light">VALID THRU</p>
                                <p className="font-bold">
                                    {createExpiry ? new Date(createExpiry).toLocaleDateString(undefined, {month:'2-digit', year:'2-digit'}) : 'NO EXP'}
                                </p>
                            </div>

                            {/* Bottom Right */}
                            <div className="absolute bottom-4 right-4 text-right leading-tight">
                                <p className="text-[9px] sm:text-[10px] opacity-80 font-bold">VALUE</p>
                                <p className="text-lg sm:text-xl font-bold">
                                    {settings.currency}{createAmount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('initialValue')}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">{settings.currency}</span>
                                <input 
                                    type="number"
                                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-800 shadow-sm"
                                    value={createAmount}
                                    onChange={e => setCreateAmount(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('quantity')}</label>
                             <input 
                                type="number"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-800 shadow-sm"
                                value={createQty}
                                onChange={e => setCreateQty(Math.max(1, Number(e.target.value)))}
                                min="1"
                             />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('expiryDate')} (Optional)</label>
                        <div className="relative">
                            <input 
                                type="date"
                                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-gray-800 min-h-[46px]"
                                value={createExpiry}
                                onChange={e => setCreateExpiry(e.target.value)}
                                style={{colorScheme: 'light'}}
                            />
                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3">{t('theme')}</label>
                        <div className="grid grid-cols-4 gap-3">
                            {(Object.keys(GIFT_CARD_THEMES) as Array<keyof typeof GIFT_CARD_THEMES>).map(theme => (
                                <button
                                    key={theme}
                                    onClick={() => setCreateTheme(theme)}
                                    className={`h-12 rounded-xl bg-gradient-to-br ${GIFT_CARD_THEMES[theme]} shadow-sm transition-all relative overflow-hidden ${createTheme === theme ? 'ring-2 ring-offset-2 ring-green-500 scale-105 shadow-md' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                                >
                                   {createTheme === theme && (
                                       <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                           <Sparkles className="w-4 h-4 text-white" />
                                       </div>
                                   )}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-2 capitalize font-medium">{createTheme} Theme</p>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 py-3" onClick={handleCreate}>
                            {t('createGiftCard')}
                        </Button>
                        <Button variant="outline" className="flex-1 py-3" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
                    </div>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};
