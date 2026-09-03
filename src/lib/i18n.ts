import { createContext, useContext } from 'react';
import type { Locale } from '../types';

/**
 * Interface strings.
 *
 * The locale switch used to change number formatting only, on the reasoning
 * that formatting and language are separate concerns. That reasoning was wrong
 * for the people this tool is for: a Turkish finance team clicking "TR" expects
 * the screen to be in Turkish, not just its decimal separators. Formatting
 * still follows the same switch -- it is the same locale -- but now so does
 * every label, heading, table header and explanation.
 *
 * Currency is still never touched by this. Which currency an amount is in is
 * data, not language.
 */
export type Dict = Record<string, string>;

const en: Dict = {
  // -- shell --
  'app.title': 'Budget vs Actual',
  'app.subtitle': 'Compare two periods and instantly see variances, entirely in your browser.',
  'app.dataCurrency': 'Data currency',
  'theme.label': 'Colour theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'Match system',
  'locale.label': 'Language and number format',
  'reset.label': 'Reset / start over',

  // -- steps --
  'step.upload': 'Upload',
  'step.map': 'Map columns',
  'step.review': 'Review',

  // -- modes --
  'mode.bva': 'Budget vs Actual',
  'mode.yoy': 'Year over Year',

  // -- mode labels --
  'labels.bva.title': 'Budget vs Actual',
  'labels.bva.base': 'Budget',
  'labels.bva.comparison': 'Actual',
  'labels.bva.increaseBad': 'Over budget is bad (expenses)',
  'labels.bva.decreaseBad': 'Under budget is bad (revenue)',
  'labels.bva.baseRate': 'Budget rate (plan)',
  'labels.bva.comparisonRate': 'Actual rate (realized)',
  'labels.bva.baseOnly': 'Budget only',
  'labels.bva.comparisonOnly': 'Actual only',
  'labels.bva.actualsFile': 'Budget file',
  'labels.bva.amountField': 'Budget amount',
  'labels.yoy.title': 'Year over Year ({base} vs {comparison})',
  'labels.yoy.baseYear': 'Base year',
  'labels.yoy.comparisonYear': 'Comparison year',
  'labels.yoy.increaseBad': 'Higher than {base} is bad',
  'labels.yoy.decreaseBad': 'Lower than {base} is bad',
  'labels.yoy.baseRate': '{base} rate',
  'labels.yoy.comparisonRate': '{comparison} rate',
  'labels.yoy.baseOnly': '{base} only',
  'labels.yoy.comparisonOnly': '{comparison} only',
  'labels.yoy.actualsFile': 'Actuals file (all years)',
  'labels.yoy.amountField': 'Amount',

  // -- controls --
  'threshold.label': 'Significant variance threshold',
  'threshold.direction': 'Bad direction',
  'reset.confirm': 'Start over? This clears the uploaded files, mapping, and results.',
  'analysisMode.label': 'Analysis mode',
  'progress.label': 'Progress',

  // -- headline stats --
  'stats.total': 'Total {name}',
  'stats.variance': 'Variance',
  'stats.flagged': 'Flagged lines',
  'stats.ofRows': 'of {n} rows',
  'stats.ofConverted': 'of {n} converted rows',
  'stats.awaitingRates': 'Enter the monthly exchange rates below to see totals — {n} rows are loaded and waiting.',
  'stats.someExcluded': '{blocked} of {total} rows are excluded from these totals — no exchange rate entered for their month yet.',

  // -- fx summary --
  'fx.splitTitle': 'Currency variance split ({currency})',
  'fx.total': 'Total variance',
  'fx.operational': 'Operational variance',
  'fx.fx': 'FX variance',
  'fx.reconciles': 'Operational + FX reconciles exactly to total variance, row by row. Covers the {n} matched rows only — a line present on just one side has nothing to decompose.',
  'fx.noRate': 'No rate',
  'fx.noRateTitle': 'No rate entered for this month — excluded from converted totals',

  // -- unmatched --
  'unmatched.toggle': '{n} unmatched rows found ({baseCount} {baseLabel}, {compCount} {compLabel})',
  'unmatched.presentIn': 'Present in',

  // -- years --
  'years.base': 'Base year',
  'years.comparison': 'Comparison year',
  'years.select': '— Select —',
  'years.none': 'We could not detect any years in the mapped month column yet — check the mapping above.',
  'years.onlyOne': 'This file only contains one year of data ({year}). Year-over-year comparison needs at least two.',
  'years.mustDiffer': 'Base year and comparison year must be different.',

  // -- shared table headers --
  'col.account': 'Account',
  'col.department': 'Department',
  'col.month': 'Month',
  'col.variance': 'Variance',
  'col.variancePct': 'Variance %',
  'col.amount': 'Amount',

  // -- export --
  'export.button': 'Export to Excel',
  'export.busy': 'Preparing export…',

  // -- FAQ --
  'faq.title': 'Frequently asked questions',
  'faq.subtitle': 'The questions finance and accounting teams ask first.',
  'faq.q1': 'Do I have to install anything?',
  'faq.a1': 'No. The tool runs entirely inside your browser. There is nothing to download, no account, no password and no fee.',
  'faq.q2': 'Is my data uploaded to a server?',
  'faq.a2': 'No. Your file is opened by the browser on your own machine and every figure is calculated there. Nothing is sent anywhere — you can disconnect from the internet and the page keeps working.',
  'faq.q3': 'Which file formats are accepted?',
  'faq.a3': 'Excel (.xlsx) and CSV. Multi-sheet workbooks are fine: you pick which sheet to use.',
  'faq.q4': 'Do my column names have to match yours?',
  'faq.a4': 'No. Headings are matched automatically — English and Turkish spellings alike — and anything the tool guesses wrong you correct from a drop-down before calculating.',
  'faq.q5': 'My months run across the top instead of down a column. Is that a problem?',
  'faq.a5': 'No, and that is the more common layout. The tool detects it, shows you which columns it read as months, and you confirm. You never have to restructure the file.',
  'faq.q6': 'Why are some rows excluded from the totals?',
  'faq.a6': 'Because counting them would double the figures. Three kinds of row are set aside: section headings with no account code, lines whose name is nothing but a total, and parent accounts that equal the sum of their sub-accounts. Every excluded row is listed with its reason, and one switch puts them all back.',
  'faq.q7': 'Can this connect to our ERP — SAP, Logo, Netsis, Mikro?',
  'faq.a7': 'Today it works from files: export the report from your ERP to Excel or CSV and upload it, which needs no development at all. A live connection is possible but is a separate project — it needs a server, and that would remove the property that makes this tool easy to approve: that your data never leaves your computer.',
  'faq.q8': 'Does it show approved orders that have not been invoiced yet?',
  'faq.a8': 'No. It compares budget against actuals — the figures already posted to your books. An approved purchase order affects the comparison only in the month its invoice is posted. If you need commitments included, export the ERP report with open orders in it.',
  'faq.q9': 'Can I report in a different currency from my file?',
  'faq.a9': 'Yes. Tick "Report in a different currency", pick the target, and enter a rate per month. Everything on screen and in the Excel export switches together — you never see two currencies at once. A month left blank is flagged, never assumed to be 1.00.',
  'faq.q10': 'What does the EN / TR switch change?',
  'faq.a10': 'The language of the interface and the number format (1,234.56 versus 1.234,56). It never changes which currency your amounts are in — that is set by "Data currency".',
  'faq.q11': 'Is it really free? Can we use it at work?',
  'faq.a11': 'Yes. It is open source under the MIT licence, which permits commercial use. Your IT department can read the source or host it on your own server.',

  // -- tables and charts --
  'table.varianceDetail': 'Variance detail',
  'table.ytdTitle': 'Total by account ({base} vs {comparison}, all months)',
  'table.sortBy': 'Sort by',
  'sort.variancePct': 'Biggest variance (%)',
  'sort.varianceAmount': 'Biggest variance (amount)',
  'sort.accountCode': 'Account code',
  'sort.month': 'Month',
  'chart.byDepartment': '{base} vs {comparison} by department',
  'chart.byAccount': '{base} vs {comparison} by account',
  'chart.monthlyTrend': 'Monthly trend',
  'chart.unassigned': 'Unassigned',
  'chart.varianceByDept': 'Where the variance is, by cost centre',
  'chart.varianceByAccount': 'Where the variance is, by account',
  'chart.varianceLede': 'Each bar is {comparison} minus {base}. Red is the direction you called bad; green is the direction you wanted.',
  'chart.deptLede': 'The two figures side by side, so you can see the size of each cost centre as well as the gap.',
  'chart.trendLede': 'How the two lines ran month by month. Where they separate is where the variance built up.',

  // -- excluded rows --
  'excluded.reason.noCode': 'No account code — reads as a section heading or roll-up',
  'excluded.reason.totalLabel': 'Labelled as a total',
  'excluded.reason.parentRollup': 'Parent account — equals the sum of its sub-accounts',
  'excluded.why': 'Why it was set aside',
  'excluded.toggleExcluded': '{n} roll-up / heading rows excluded to avoid double counting',
  'excluded.toggleIncluded': '{n} roll-up / heading rows included in the totals',
  'excluded.treatAsNormal': 'Treat these as normal accounts instead',

  // -- upload --
  'upload.hero.bva': 'See exactly where you landed off budget',
  'upload.hero.yoy': 'Compare this year against last year, line by line',
  'upload.sub.bva': 'Upload your budget and your actuals. Every account is matched by month and department, variances are calculated for you, and anything past your threshold is flagged.',
  'upload.sub.yoy': 'Upload one actuals export covering both years. Every account is matched month to month, so new and discontinued lines stand out instead of disappearing.',
  'upload.trySample': '▸ Try it with sample data',
  'upload.loadingSample': 'Loading sample…',
  'upload.noFile': 'No file handy? {description}.',
  'upload.sample.bva': '3 months of budget vs actual across 2 departments, including 2 intentionally unmatched rows',
  'upload.sample.yoy': '2025 vs 2026 actuals across 2 departments, including a new and a discontinued account',
  'upload.orOwn': 'or use your own files',
  'upload.modeLabel': 'Upload mode',
  'upload.twoFiles': 'Two separate files',
  'upload.oneFile': 'One combined file',
  'upload.actualsFile': 'Actuals file',
  'upload.actualsHint': 'One file covering both years — you will pick which two to compare next.',
  'upload.budgetFile': 'Budget file',
  'upload.actualFile': 'Actual file',
  'upload.csvOrExcel': 'CSV or Excel',
  'upload.combinedFile': 'Combined file',
  'upload.combinedHint': 'Must contain both a budget and an actual amount column',
  'upload.continue': 'Continue to column mapping',
  'upload.reading': 'Reading files…',
  'upload.err.yoy': 'Please choose an actuals file.',
  'upload.err.budget': 'Please choose a budget file.',
  'upload.err.actual': 'Please choose an actual file.',
  'upload.err.combined': 'Please choose a file.',
  'upload.err.read': 'Something went wrong while reading the file.',
  'benefit.1.title': 'Nothing leaves your browser',
  'benefit.1.body': 'Files are parsed locally. No upload, no account, no server.',
  'benefit.2.title': 'Your column names, not ours',
  'benefit.2.body': 'Headers are auto-detected and you can correct any guess.',
  'benefit.3.title': 'Back to Excel in one click',
  'benefit.3.body': 'Export the variance detail, YTD totals and a summary sheet.',

  // -- mapping --
  'map.title': 'Column mapping',
  'map.accountCode': 'Account code',
  'map.accountName': 'Account name',
  'map.department': 'Department',
  'map.month': 'Month / period',
  'map.budgetAmount': 'Budget amount',
  'map.actualAmount': 'Actual amount',
  'map.notMapped': '— Not mapped —',
  'sheet.sheet': 'Sheet',
  'sheet.headerRow': 'Header row',
  'sheet.rowPreview': 'Row {n}: {preview}',
  'sheet.blank': '(blank)',
  'sheet.layoutLegend': 'How are the months laid out?',
  'sheet.longOption': 'One row per month',
  'sheet.longHint': '(a Period / Month column)',
  'sheet.wideOption': 'A column per month',
  'sheet.wideHint': '(Jan, Feb, Mar… across the top)',
  'sheet.monthsFound': 'These columns were recognised as months — untick anything that is not a period.',
  'sheet.monthsNotFound': 'No month-like column headers were recognised. Tick the period columns yourself.',

  // -- currency panel --
  'fxPanel.toggle': 'Report in a different currency',
  'fxPanel.target': 'Target currency',
  'fxPanel.sameCurrency': 'Target currency matches the data currency ({currency}) — there is nothing to convert, so the variance split is hidden.',
  'fxPanel.convention': 'Convention: the FX effect is measured on {comparison} volume — it is the difference the rate movement alone would make if the {comparison} amount had been converted at the {base} rate instead. Once enabled, every figure on screen and in the export switches to {target} — nothing stays in {data}.',
  'rate.quotedAs': 'Every rate below is quoted as {quote} — enter the number exactly as you would see it quoted, regardless of which side is your data currency. The column headers repeat this so you can never enter it backwards.',
  'rate.perMonth': 'Rates apply per calendar month. Leave a month blank to exclude it from the converted figures — it will be flagged in the table and export, never assumed to be 1.0. You can paste a column of rates copied from Excel directly into the first cell of a column.',
  'rate.applyAll': 'Apply one {label} ({quote}) to all {n} months:',
  'rate.apply': 'Apply',
  'rate.mapFirst': 'Map your data first — rate entry rows appear once months are detected.',
  'sheet.needPeriod': 'Select at least one period column to continue.',
  'mapping.title': '2. Map your columns',
  'mapping.hint': 'We have pre-filled our best guess for each field — adjust any that look wrong. Fields marked with * are required.',
  'mapping.back': 'Back / start over',
  'mapping.confirm': 'Confirm mapping & calculate variance',
  'mapping.columns': 'Columns',
  'mapping.whichYears': 'Which years are you comparing?',
  'mode.switchConfirm': 'Switching analysis mode will clear your current upload and results. Continue?',
};

const tr: Dict = {
  'app.title': 'Bütçe / Gerçekleşen',
  'app.subtitle': 'İki dönemi karşılaştırın, sapmaları anında görün — tamamı tarayıcınızda çalışır.',
  'app.dataCurrency': 'Veri para birimi',
  'theme.label': 'Renk teması',
  'theme.light': 'Açık',
  'theme.dark': 'Koyu',
  'theme.system': 'Sistemle aynı',
  'locale.label': 'Dil ve sayı biçimi',
  'reset.label': 'Sıfırla / baştan başla',

  'step.upload': 'Yükleme',
  'step.map': 'Sütun eşleştirme',
  'step.review': 'Sonuç',

  'mode.bva': 'Bütçe / Gerçekleşen',
  'mode.yoy': 'Yıldan Yıla',

  'labels.bva.title': 'Bütçe / Gerçekleşen',
  'labels.bva.base': 'Bütçe',
  'labels.bva.comparison': 'Gerçekleşen',
  'labels.bva.increaseBad': 'Bütçeyi aşmak kötü (gider)',
  'labels.bva.decreaseBad': 'Bütçenin altında kalmak kötü (gelir)',
  'labels.bva.baseRate': 'Bütçe kuru (plan)',
  'labels.bva.comparisonRate': 'Gerçekleşen kur',
  'labels.bva.baseOnly': 'Yalnızca bütçede',
  'labels.bva.comparisonOnly': 'Yalnızca gerçekleşende',
  'labels.bva.actualsFile': 'Bütçe dosyası',
  'labels.bva.amountField': 'Bütçe tutarı',
  'labels.yoy.title': 'Yıldan Yıla ({base} / {comparison})',
  'labels.yoy.baseYear': 'Baz yıl',
  'labels.yoy.comparisonYear': 'Karşılaştırma yılı',
  'labels.yoy.increaseBad': '{base} yılından yüksek olması kötü',
  'labels.yoy.decreaseBad': '{base} yılından düşük olması kötü',
  'labels.yoy.baseRate': '{base} kuru',
  'labels.yoy.comparisonRate': '{comparison} kuru',
  'labels.yoy.baseOnly': 'Yalnızca {base}',
  'labels.yoy.comparisonOnly': 'Yalnızca {comparison}',
  'labels.yoy.actualsFile': 'Gerçekleşen dosyası (tüm yıllar)',
  'labels.yoy.amountField': 'Tutar',

  'threshold.label': 'Önemli sapma eşiği',
  'threshold.direction': 'Kötü yön',
  'reset.confirm': 'Baştan başlansın mı? Yüklenen dosyalar, eşleştirme ve sonuçlar silinir.',
  'analysisMode.label': 'Analiz modu',
  'progress.label': 'İlerleme',

  'stats.total': 'Toplam {name}',
  'stats.variance': 'Sapma',
  'stats.flagged': 'İşaretli satır',
  'stats.ofRows': '{n} satırın içinde',
  'stats.ofConverted': 'çevrilen {n} satırın içinde',
  'stats.awaitingRates': 'Toplamları görmek için aşağıya aylık kurları girin — {n} satır yüklendi ve bekliyor.',
  'stats.someExcluded': '{total} satırın {blocked} tanesi bu toplamlara dahil değil — o aylar için henüz kur girilmedi.',

  'fx.splitTitle': 'Kur farkı ayrıştırması ({currency})',
  'fx.total': 'Toplam sapma',
  'fx.operational': 'Operasyonel sapma',
  'fx.fx': 'Kur sapması',
  'fx.reconciles': 'Operasyonel + Kur, her satırda toplam sapmaya birebir eşittir. Yalnızca eşleşen {n} satırı kapsar — tek tarafta bulunan bir satırın ayrıştırılacak bir yanı yoktur.',
  'fx.noRate': 'Kur yok',
  'fx.noRateTitle': 'Bu ay için kur girilmedi — çevrilen toplamlara dahil edilmedi',

  'unmatched.toggle': '{n} eşleşmeyen satır bulundu ({baseCount} {baseLabel}, {compCount} {compLabel})',
  'unmatched.presentIn': 'Nerede var',

  'years.base': 'Baz yıl',
  'years.comparison': 'Karşılaştırma yılı',
  'years.select': '— Seçin —',
  'years.none': 'Eşleştirilen dönem sütununda henüz bir yıl tespit edemedik — yukarıdaki eşleştirmeyi kontrol edin.',
  'years.onlyOne': 'Bu dosyada yalnızca tek yıllık veri var ({year}). Yıldan yıla karşılaştırma için en az iki yıl gerekir.',
  'years.mustDiffer': 'Baz yıl ile karşılaştırma yılı farklı olmalıdır.',

  'col.account': 'Hesap',
  'col.department': 'Masraf merkezi',
  'col.month': 'Dönem',
  'col.variance': 'Sapma',
  'col.variancePct': 'Sapma %',
  'col.amount': 'Tutar',

  'export.button': "Excel'e aktar",
  'export.busy': 'Dosya hazırlanıyor…',

  'faq.title': 'Sıkça sorulan sorular',
  'faq.subtitle': 'Finans ve muhasebe ekiplerinin ilk sorduğu sorular.',
  'faq.q1': 'Bilgisayarıma bir şey kurmam gerekiyor mu?',
  'faq.a1': 'Hayır. Uygulama tamamen tarayıcınızın içinde çalışır. İndirilecek bir program, üyelik, şifre ya da ücret yok.',
  'faq.q2': 'Verilerim bir sunucuya yükleniyor mu?',
  'faq.a2': 'Hayır. Dosyanızı tarayıcı kendi bilgisayarınızda açar ve bütün hesaplar orada yapılır. Hiçbir veri dışarı gönderilmez — internet bağlantınızı kesseniz bile sayfa çalışmaya devam eder.',
  'faq.q3': 'Hangi dosya biçimleri kabul ediliyor?',
  'faq.a3': 'Excel (.xlsx) ve CSV. Birden fazla sayfası olan dosyalar da sorun değil; hangi sayfanın kullanılacağını siz seçersiniz.',
  'faq.q4': 'Sütun adlarımın sizinkiyle aynı olması gerekiyor mu?',
  'faq.a4': 'Hayır. Başlıklar otomatik eşleştirilir — Türkçe ve İngilizce yazımlar dahil. Yanlış tahmin edilen bir alanı hesaplamadan önce açılır listeden düzeltirsiniz.',
  'faq.q5': 'Bende aylar sütun sütun yatayda duruyor, sorun olur mu?',
  'faq.a5': 'Hayır, zaten yaygın olan biçim budur. Uygulama bunu tanır, hangi sütunları ay olarak okuduğunu size gösterir ve siz onaylarsınız. Dosyanızı yeniden düzenlemeniz gerekmez.',
  'faq.q6': 'Bazı satırlar toplamlara neden dahil edilmiyor?',
  'faq.a6': 'Çünkü dahil edilseler rakamlar iki kat çıkardı. Üç tür satır ayrılır: hesap kodu olmayan bölüm başlıkları, adı yalnızca bir toplam ifadesi olan satırlar ve alt hesaplarının toplamına eşit olan ana hesaplar. Ayrılan her satır gerekçesiyle listelenir; tek anahtarla hepsini geri alabilirsiniz.',
  'faq.q7': 'ERP sistemimize bağlanır mı — SAP, Logo, Netsis, Mikro?',
  'faq.a7': 'Bugün dosya üzerinden çalışır: raporu ERP’nizden Excel ya da CSV olarak alıp yüklersiniz, bunun için hiçbir geliştirme gerekmez. Canlı bağlantı mümkündür ama ayrı bir projedir — sunucu gerektirir, bu da uygulamanın onaylanmasını kolaylaştıran özelliği, yani verinizin bilgisayarınızdan hiç çıkmamasını ortadan kaldırır.',
  'faq.q8': 'Onaylanmış ama faturası gelmemiş siparişler görünüyor mu?',
  'faq.a8': 'Hayır. Uygulama bütçe ile gerçekleşeni, yani defterlere işlenmiş rakamları karşılaştırır. Onaylanmış bir sipariş, karşılaştırmayı ancak faturasının muhasebeleştiği ay etkiler. Taahhütlerin de görünmesini istiyorsanız ERP raporunu açık siparişler dahil edilmiş şekilde alın.',
  'faq.q9': 'Raporu dosyamdakinden farklı bir para biriminde alabilir miyim?',
  'faq.a9': 'Evet. “Report in a different currency” kutusunu işaretleyin, hedef para birimini seçin ve her ay için kur girin. Ekrandaki her şey ve Excel çıktısı birlikte değişir — ekranda asla iki para birimi birden görünmez. Boş bıraktığınız ay işaretlenir, asla 1,00 varsayılmaz.',
  'faq.q10': 'EN / TR düğmesi neyi değiştiriyor?',
  'faq.a10': 'Arayüzün dilini ve sayı biçimini (1,234.56 yerine 1.234,56). Tutarlarınızın hangi para biriminde olduğunu değiştirmez — onu “Veri para birimi” belirler.',
  'faq.q11': 'Gerçekten ücretsiz mi? İş yerinde kullanabilir miyiz?',
  'faq.a11': 'Evet. MIT lisanslı açık kaynak bir uygulama; ticari kullanıma da açıktır. BT biriminiz kaynak kodu inceleyebilir ya da kendi sunucunuzda barındırabilir.',

  'table.varianceDetail': 'Sapma detayı',
  'table.ytdTitle': 'Hesap bazında toplam ({base} / {comparison}, tüm aylar)',
  'table.sortBy': 'Sıralama',
  'sort.variancePct': 'En büyük sapma (%)',
  'sort.varianceAmount': 'En büyük sapma (tutar)',
  'sort.accountCode': 'Hesap kodu',
  'sort.month': 'Dönem',
  'chart.byDepartment': 'Masraf merkezine göre {base} / {comparison}',
  'chart.byAccount': 'Hesaba göre {base} / {comparison}',
  'chart.monthlyTrend': 'Aylık seyir',
  'chart.unassigned': 'Atanmamış',
  'chart.varianceByDept': 'Sapma nerede — masraf merkezine göre',
  'chart.varianceByAccount': 'Sapma nerede — hesaba göre',
  'chart.varianceLede': 'Her çubuk {comparison} eksi {base} demektir. Kırmızı sizin kötü dediğiniz yön, yeşil istediğiniz yön.',
  'chart.deptLede': 'İki rakam yan yana; hem her masraf merkezinin büyüklüğünü hem aradaki farkı görürsünüz.',
  'chart.trendLede': 'İki çizginin ay ay seyri. Ayrıştıkları yer, sapmanın biriktiği yerdir.',

  'excluded.reason.noCode': 'Hesap kodu yok — bölüm başlığı ya da toplam satırı gibi okunuyor',
  'excluded.reason.totalLabel': 'Adı toplam satırı olarak yazılmış',
  'excluded.reason.parentRollup': 'Ana hesap — alt hesaplarının toplamına eşit',
  'excluded.why': 'Neden ayrıldı',
  'excluded.toggleExcluded': 'Çift sayımı önlemek için {n} toplam / başlık satırı hariç tutuldu',
  'excluded.toggleIncluded': '{n} toplam / başlık satırı toplamlara dahil edildi',
  'excluded.treatAsNormal': 'Bunları normal hesap gibi say',

  'upload.hero.bva': 'Bütçeden nerede saptığınızı tam olarak görün',
  'upload.hero.yoy': 'Bu yılı geçen yılla satır satır karşılaştırın',
  'upload.sub.bva': 'Bütçe ve gerçekleşen dosyalarınızı yükleyin. Her hesap ay ve masraf merkezine göre eşleştirilir, sapmalar sizin için hesaplanır ve eşiğinizi aşan her satır işaretlenir.',
  'upload.sub.yoy': 'İki yılı birden içeren tek bir gerçekleşen dosyası yükleyin. Her hesap ay ay eşleştirilir; böylece yeni açılan ve kapanan hesaplar kaybolmak yerine göze çarpar.',
  'upload.trySample': '▸ Örnek veriyle deneyin',
  'upload.loadingSample': 'Örnek yükleniyor…',
  'upload.noFile': 'Elinizde dosya yok mu? {description}.',
  'upload.sample.bva': '2 masraf merkezinde 3 aylık bütçe ve gerçekleşen; bilerek eşleşmeyen 2 satır dahil',
  'upload.sample.yoy': '2 masraf merkezinde 2025 ve 2026 gerçekleşenleri; biri yeni, biri kapanmış hesap dahil',
  'upload.orOwn': 'ya da kendi dosyalarınızı kullanın',
  'upload.modeLabel': 'Yükleme biçimi',
  'upload.twoFiles': 'İki ayrı dosya',
  'upload.oneFile': 'Tek birleşik dosya',
  'upload.actualsFile': 'Gerçekleşen dosyası',
  'upload.actualsHint': 'İki yılı da içeren tek dosya — hangi ikisini karşılaştıracağınızı sonra seçeceksiniz.',
  'upload.budgetFile': 'Bütçe dosyası',
  'upload.actualFile': 'Gerçekleşen dosyası',
  'upload.csvOrExcel': 'CSV ya da Excel',
  'upload.combinedFile': 'Birleşik dosya',
  'upload.combinedHint': 'Hem bütçe hem gerçekleşen tutar sütunu içermelidir',
  'upload.continue': 'Sütun eşleştirmeye geç',
  'upload.reading': 'Dosyalar okunuyor…',
  'upload.err.yoy': 'Lütfen bir gerçekleşen dosyası seçin.',
  'upload.err.budget': 'Lütfen bir bütçe dosyası seçin.',
  'upload.err.actual': 'Lütfen bir gerçekleşen dosyası seçin.',
  'upload.err.combined': 'Lütfen bir dosya seçin.',
  'upload.err.read': 'Dosya okunurken bir sorun oluştu.',
  'benefit.1.title': 'Hiçbir veri tarayıcınızdan çıkmaz',
  'benefit.1.body': 'Dosyalar bilgisayarınızda işlenir. Yükleme yok, hesap yok, sunucu yok.',
  'benefit.2.title': 'Sizin sütun adlarınız, bizimkiler değil',
  'benefit.2.body': 'Başlıklar otomatik tanınır, yanlış tahminleri siz düzeltirsiniz.',
  'benefit.3.title': "Tek tıkla Excel'e geri",
  'benefit.3.body': 'Sapma detayını, kümüle toplamları ve özet sayfasını dışa aktarın.',

  'map.title': 'Sütun eşleştirme',
  'map.accountCode': 'Hesap kodu',
  'map.accountName': 'Hesap adı',
  'map.department': 'Masraf merkezi',
  'map.month': 'Dönem / ay',
  'map.budgetAmount': 'Bütçe tutarı',
  'map.actualAmount': 'Gerçekleşen tutar',
  'map.notMapped': '— Eşleştirilmedi —',
  'sheet.sheet': 'Sayfa',
  'sheet.headerRow': 'Başlık satırı',
  'sheet.rowPreview': '{n}. satır: {preview}',
  'sheet.blank': '(boş)',
  'sheet.layoutLegend': 'Aylar nasıl yerleşmiş?',
  'sheet.longOption': 'Her ay ayrı satırda',
  'sheet.longHint': '(bir Dönem / Ay sütunu var)',
  'sheet.wideOption': 'Her ay ayrı sütunda',
  'sheet.wideHint': '(Oca, Şub, Mar… yatayda)',
  'sheet.monthsFound': 'Bu sütunlar ay olarak tanındı — dönem olmayan varsa işaretini kaldırın.',
  'sheet.monthsNotFound': 'Ay gibi görünen bir sütun başlığı tanınmadı. Dönem sütunlarını kendiniz işaretleyin.',

  'fxPanel.toggle': 'Farklı bir para biriminde raporla',
  'fxPanel.target': 'Hedef para birimi',
  'fxPanel.sameCurrency': 'Hedef para birimi veri para birimiyle aynı ({currency}) — çevrilecek bir şey yok, bu yüzden kur ayrıştırması gizlendi.',
  'fxPanel.convention': 'Yöntem: kur etkisi {comparison} hacmi üzerinden ölçülür — {comparison} tutarı {base} kuruyla çevrilseydi ortaya çıkacak farktır. Açtığınız anda ekrandaki ve çıktıdaki her rakam {target} para birimine döner; hiçbir şey {data} olarak kalmaz.',
  'rate.quotedAs': 'Aşağıdaki her kur {quote} biçiminde yazılır — hangi tarafın veri para biriminiz olduğuna bakmaksızın, kuru piyasada gördüğünüz gibi girin. Sütun başlıkları bunu tekrar eder, böylece ters girmeniz mümkün olmaz.',
  'rate.perMonth': 'Kurlar takvim ayı bazında uygulanır. Bir ayı boş bırakırsanız o ay çevrilmez — tabloda ve çıktıda işaretlenir, asla 1,0 varsayılmaz. Excel’den kopyaladığınız bir kur sütununu doğrudan ilk hücreye yapıştırabilirsiniz.',
  'rate.applyAll': 'Tek bir {label} ({quote}) değerini {n} ayın hepsine uygula:',
  'rate.apply': 'Uygula',
  'rate.mapFirst': 'Önce verinizi eşleştirin — aylar tespit edilince kur satırları görünür.',
  'sheet.needPeriod': 'Devam etmek için en az bir dönem sütunu seçin.',
  'mapping.title': '2. Sütunlarınızı eşleştirin',
  'mapping.hint': 'Her alan için en iyi tahminimizi hazır girdik — yanlış görünenleri düzeltin. * işaretli alanlar zorunludur.',
  'mapping.back': 'Geri / baştan başla',
  'mapping.confirm': 'Eşleştirmeyi onayla ve sapmayı hesapla',
  'mapping.columns': 'Sütunlar',
  'mapping.whichYears': 'Hangi yılları karşılaştırıyorsunuz?',
  'mode.switchConfirm': 'Analiz modunu değiştirmek mevcut yüklemenizi ve sonuçlarınızı siler. Devam edilsin mi?',
};

const DICTS: Record<Locale, Dict> = { en, tr };

export const LocaleContext = createContext<Locale>('en');

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  // Fall back to English rather than rendering a raw key: a missing Turkish
  // string should read as untranslated, never as debug output.
  const text = DICTS[locale][key] ?? en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

export function useT(): Translate {
  const locale = useContext(LocaleContext);
  return (key, vars) => translate(locale, key, vars);
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
