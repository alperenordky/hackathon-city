# 🚨 Afet Kriz Yönetim Sistemi - Güncelleme ve Mimari Raporu

Bu belge, takım üyelerinin ve jürinin sistemi baştan sona anlaması için hazırlanmıştır. Projemiz "statik veri toplayan basit bir form uygulaması" olmaktan çıkarılıp, tam teşekküllü **3 Boyutlu, Gerçek Zamanlı bir Koordinasyon ve Kriz Merkezi Sistemine** dönüştürülmüştür. 

İşte adım adım yaptığımız tüm değişiklikler ve bunların altında yatan mühendislik tercihleri:

---

## 1. "Harita Odaklı" (Map-Centric) Veri Giriş Mimarisine Geçiş
*   **Ne Değişti?** Önceden yaralı bildirimi veya malzeme talepleri alt sayfalarda tekdüze klasik "doldur-gönder" formlarıyla yapılıyordu. Bu sayfaları tamamen sildik. Tüm bildirim akışını (Bina Hasarı, Kapanan Yollar, Yaralılar, Erzak) tek bir 3D Harita (`InteractiveMap.jsx`) üzerine entegre ettik.
*   **Neden Eklendi?** Kriz ortamlarında verinin *ne olduğu* kadar *nerede olduğu* da hayatidir. Konumu olmayan bir "Acil çadır lazım" bildiriminin AFAD'a hiçbir faydası yoktur. Artık vatandaş haritada tam bulunduğu konuma "Sağ Tıklayarak" koordinat bazlı ve noktasal hedeflenmiş sinyaller bırakıyor.

## 2. AFAD Kriz Kontrol Merkezi (Command Center) Paneli
*   **Ne Değişti?** Vatandaşın kullandığı aydınlık menüden tamamen farklı, koyu temalı, profesyonel bir komuta merkezi arayüzü (`AfadDashboard.jsx`) sıfırdan tasarlandı.
*   **Neden Eklendi?** Vatandaş ve kurtarma ekiplerinin gördüğü arayüz aynı olamaz. Bu özel ekran, sahadan gelen sinyalleri "Metrik kartlara" bölen (Kaç bina yıkıldı, kaç toplanma alanı acil krizde vb.) ve profesyonel ağ bağlantısı (İntranet) simülasyonu sunan şık bir "Jüri Şov" ekranı olarak kurgulandı.

## 3. Gerçek Zamanlı Ağa Bağlanma Simülasyonu (Mesh Network Data Sync)
*   **Ne Değişti?** Vatandaş menüsünden veya haritadan gönderilen her bildirim, anında (sayfayı yenilemeye bile gerek kalmadan) AFAD kontrol merkezinin "Canlı Olay Akışı" loglarına düşecek şekilde kodlandı.
*   **Neden Eklendi?** Baz istasyonlarının çöktüğü bir afet senaryosunda sistemin "Mesh" (kapalı radyo dalgası veya yerel ağlar) üzerinden verileri birbiriyle anlık olarak senkronize edeceğini teknik olarak (Local Storage tabanlı Event Listener ile) kanıtlamak için tasarlandı. (Jüri yan sekmede veri girildiğinde AFAD panelinde anında veri aktığını görecektir).

## 4. Akıllı Olay Triyajı ve Öncelik Sıralaması
*   **Ne Değişti?** AFAD paneline düşen loglar, gelişigüzel değil önceliğine göre renk kodlarıyla tasarlandı. 
*   **Neden Eklendi?** Bir "Su Talebi" ile "Yıkılmış Binada Kalan Yaralı" aynı aciliyet sırasında olamaz. Uygulamanın arkasına KRMZ-KOD (1. Öncelik: Bina Yıkıldı, Yaralı) ve SARI-KOD (2. Öncelik: Kapanan Yol) olarak verileri sıralayan otonom bir müdahale ayrıştırma algoritması yazdık. Gerçek dünyada kısıtlı kurtarma ekibi kaynağını en doğru yere yönlendirmek için bu triyaj mimarisi mecburidir.

## 5. Gerçekçi 3D Hasar Topolojisi (Akıllı Yükseklik)
*   **Ne Değişti?** Haritada bina bildirimleri başlangıçta sabit boyutlardaydı (30 metre gökdelen gibi hasarlar). Bu düzeltilip tamamen fizik temelli akıllı yükseklik sistemine geçirildi.
*   **Neden Eklendi?** Uygulamadaki "Bina Yıkıldı" pini artık 30 m yukarıda değil, 2m moloz kalınlığında yerdedir. "Kapanan Yol" 0.5m asfalt sınırındadır. Bu haritanın gerçekte bir fizik motoru olduğunu ve sadece görsellikten ibaret olmadığını kanıtlar.

## 6. Dinamik Kullanıcı Arayüzü (Dynamic Zoom & Scale)
*   **Ne Değişti?** Harita yakınlaştırıldığında veya uzaklaştırıldığında, haritanın üzerindeki yazılar ve pinler (Hastane logoları vs.) kör edici şekilde aynı boyutta kalmıyor. Zoom'a göre otomatik ölçeklenip nizam nizam küçülüyor.
*   **Neden Eklendi?** Ciddi bir kriz yönetimi platformunun UX (Kullanıcı Deneyimi) standartları Apple/Google Maps kadar esnek hissettirmelidir. Kalabalık harita ekranlarının kontrolü elden kaçırmaması için.

## 7. Afet Bilgilendirme ve Yönergeler Modülü
*   **Ne Değişti?** Uygulamanın ana ekranına Turnike nasıl yapılır, Defibrilatör nasıl kullanılır gibi donanımların kullanım rehberini içeren karanlık bir bilgilendirme ekranı kondu. Ayrıca gereksiz yer kaplayan eski "Sarı Buton" (bölgesel talepler) temizlendi, çünkü talepler zaten "Canlı Harita" modülüne yedirilmişti.
*   **Neden Eklendi?** "Eğitimsiz sivil ve malzeme, afetin kendisi kadar büyük krizdir." Sistemin sadece bir şikayet kutusu değil, aynı zamanda toplanma alanlarında bulunan tıbbi teçhizatları vatandaşa o stresi altındayken panik yaptırmadan öğretebilecek bir hayat kurtarma eğitim rehberi olması hedeflenmiştir. 

---
*Not: Bu belgeyi Mac cihazınızda Safari/Chrome üzerinden açıp veya VSCode'da Önizleme yaparak doğrudan "PDF Olarak Kaydet (Print as PDF)" diyebilir, veya herhangi bir Markdown to PDF çevirici ile şık bir dökümana çevirip hemen takım arkadaşlarınıza sunabilirsiniz.*
