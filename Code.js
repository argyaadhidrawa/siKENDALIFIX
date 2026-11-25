//============================================
// DOGET, PWA & HALAMAN VERIFIKASI PUBLIK
//============================================
function doGet(e){
  var p=(e&&e.parameter)?e.parameter:{};
  if(p.verifikasi) return HtmlService.createHtmlOutput(getVerificationPage(p.verifikasi))
    .setTitle('Verifikasi Tanda Tangan Elektronik — KENDALI')
    .addMetaTag('viewport','width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  if(p.manifest==='true') return ContentService.createTextOutput(JSON.stringify(getManifest())).setMimeType(ContentService.MimeType.JSON);
  if(p.sw==='true') return ContentService.createTextOutput(getServiceWorkerCode()).setMimeType(ContentService.MimeType.JAVASCRIPT);
  return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('KENDALI - Bagian Organisasi Setda Kab. Banyuwangi')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}
function include(f){ return HtmlService.createHtmlOutputFromFile(f).getContent(); }
function getManifest(){
  var u=ScriptApp.getService().getUrl(), i='https://lh3.googleusercontent.com/d/19vO2cXzfk6ajSVffygRYBfEUj_FQ6Mtf';
  return {name:'KENDALI - Bagian Organisasi Setda Kab. Banyuwangi',short_name:'KENDALI',description:'Agenda, Notulen, Bank Data & Persetujuan TPP',
    start_url:u,scope:u,display:'standalone',orientation:'any',background_color:'#ffffff',theme_color:'#6366f1',lang:'id-ID',
    icons:[{src:i,sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:i,sizes:'512x512',type:'image/png',purpose:'any maskable'}],categories:['productivity','business']};
}
function getServiceWorkerCode(){
  return "const C='kendali-v16';self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(n=>Promise.all(n.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{if(r&&r.status===200&&r.type==='basic'){const c=r.clone();caches.open(C).then(k=>k.put(e.request,c));}return r;}).catch(()=>caches.match(e.request).then(r=>r||new Response('<h1>Offline</h1>',{headers:{'Content-Type':'text/html'}}))));});";
}

//============================================
// KONSTANTA
//============================================
var LOGO_KOP_ID='1mRJpVYb1nN2ibvn47W1yCRnEGnknjhuM';
var BULAN_ID=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var BULAN_SHORT=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
var HARI_ID=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
var ROMAWI=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
var JENIS_DOKUMEN=['SK','Perbup','Perda','Peraturan Sekda','Surat Edaran','SOP','Anjab / ABK','Laporan','Kajian / Analisis','Draft Raperda','Draft Raperbup','Berita Acara','Notulen','Surat Tugas','Instruksi','Materi Paparan','Lainnya'];
var KATEGORI_DOKUMEN=['Kelembagaan','Ketatalaksanaan','Pelayanan Publik','Reformasi Birokrasi','Akuntabilitas Kinerja','Analisis Jabatan & Beban Kerja','TPP','Umum'];
var STATUS_DOKUMEN=['Final'];
var OBJEK_DEFAULT='data serta dokumen pendukung Tambahan Penghasilan Pegawai (TPP)';
var PROFIL_HEAD=['SKPD','Kode','Admin_Jabatan','Admin_Nama','Admin_NIP','Admin_Pangkat','Admin_TTD_ID','Admin_TTD_W','Admin_TTD_H','Admin_Metode','Kepala_Jabatan','Kepala_Nama','Kepala_NIP','Kepala_Pangkat','Kepala_TTD_ID','Kepala_TTD_W','Kepala_TTD_H','Kepala_Metode','Kepala_Pin_Hash','Updated','Updated_By'];
var TPP_HEAD=['ID','SKPD','Kode_SKPD','Tahun','Bulan','Tgl7','Tgl7_Waktu','Tgl7_Oleh_NIP','Tgl7_Oleh_Nama','Tgl10','Tgl10_Waktu','Tgl10_Oleh_NIP','Tgl10_Oleh_Nama','Status','BA_Nomor','BA_File_ID','BA_Waktu','BA_Oleh','PIC_NIP','PIC_Nama','Last_Update','BA_Final_File_ID','BA_Final_Name','BA_Final_Type','BA_Final_Size','BA_Final_Upload','BA_Final_By'];
var SIG_HEAD=['ID','Token','Hash','Jenis','ID_Dokumen','Nomor_Dokumen','SKPD','Periode','Peran','NIP','Nama','Pangkat','Jabatan','Waktu','Metode','Operator_NIP','Operator_Nama','Status','File_ID','URL','Waktu_ISO'];

function TZ(){ return Session.getScriptTimeZone(); }
function canon(s){ return String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]/g,''); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDT(v){ return v?Utilities.formatDate(new Date(v),TZ(),'dd/MM/yyyy HH:mm'):''; }
function dtParts(v){
  if(!v) return {tgl:'',jam:''};
  var d=(v instanceof Date)?v:new Date(v); if(isNaN(d.getTime())) return {tgl:'',jam:''};
  return {tgl:Utilities.formatDate(d,TZ(),'dd/MM/yyyy'),jam:Utilities.formatDate(d,TZ(),'HH.mm')};
}
function tglPanjang(v){
  var d=(v instanceof Date)?v:new Date(v); if(isNaN(d.getTime())) return '-';
  return HARI_ID[d.getDay()]+', '+d.getDate()+' '+BULAN_ID[d.getMonth()]+' '+d.getFullYear();
}
function normalizeRole(raw){
  var s=String(raw==null?'':raw).toLowerCase().replace(/[\s_\-\.\/\(\)\[\]:,;'"`]/g,'');
  if(!s) return 'UserOPD';
  if(s.indexOf('superadmin')>-1||s.indexOf('superuser')>-1||s==='super'||s==='admin'||s==='administrator'||s.indexOf('kabagorg')>-1) return 'Superadmin';
  if(s.indexOf('teaminternal')>-1||s.indexOf('internalteam')>-1||s==='internal'||s==='team'||s.indexOf('stafinternal')>-1||s.indexOf('staffinternal')>-1||s.indexOf('teamorg')>-1||s.indexOf('timinternal')>-1) return 'TeamInternal';
  return 'UserOPD';
}
function roleOrder(r){ return r==='Superadmin'?0:(r==='TeamInternal'?1:2); }
function roleLabel(r){ return r==='Superadmin'?'Superadmin':(r==='TeamInternal'?'Team Internal':'User OPD'); }
function colLetter(i){ if(i==null||i<0) return '-'; var n=i+1,s=''; while(n>0){ var m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-m)/26); } return s; }
function normMetode(v){ return String(v||'').toUpperCase().indexOf('MAN')>-1?'MANUAL':'ELEKTRONIK'; }

//============================================
// KRIPTO & TOKEN
//============================================
function getSignSecret(){
  var p=PropertiesService.getScriptProperties(),k='KENDALI_SIGN_SECRET',v=p.getProperty(k);
  if(!v){ v=Utilities.getUuid()+'-'+Utilities.getUuid(); p.setProperty(k,v); }
  return v;
}
function sha256Hex(s){
  var b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8),h='';
  for(var i=0;i<b.length;i++){ var x=(b[i]<0?b[i]+256:b[i]).toString(16); if(x.length<2) x='0'+x; h+=x; }
  return h.toUpperCase();
}
function pinHash(skpd,pin){ return sha256Hex(getSignSecret()+'|PIN|'+canon(skpd)+'|'+String(pin)); }
function sigHash(o){
  return sha256Hex([getSignSecret(),o.token,o.jenis,o.idDok,o.nomor,canon(o.skpd),o.periode,o.peran,o.nip,o.nama,o.pangkat,o.jabatan,o.waktuISO,o.operatorNip].join('|'));
}
function newToken(){
  var s=setupTTDSheet(), used={};
  if(s.getLastRow()>1){ var d=s.getRange(2,2,s.getLastRow()-1,1).getValues(); for(var i=0;i<d.length;i++) used[String(d[i][0])]=true; }
  for(var t=0;t<40;t++){
    var k=Utilities.getUuid().replace(/-/g,'').substring(0,14).toUpperCase();
    if(!used[k]) return k;
  }
  return Utilities.getUuid().replace(/-/g,'').toUpperCase();
}

//============================================
// DATA OPD
//============================================
function OPD_LIST(){
  return ["Sekretariat Daerah","Dinas Pendidikan","Dinas Perpustakaan dan Kearsipan","Kecamatan Licin","Kecamatan Blimbingsari","Kecamatan Glagah",
  "Dinas Kesehatan","Dinas Lingkungan Hidup","Dinas Perhubungan","Kecamatan Banyuwangi","Kecamatan Srono","Kecamatan Giri",
  "Sekretariat DPRD","Inspektorat","Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu","Kecamatan Wongsorejo","Kecamatan Kabat","Kecamatan Rogojampi",
  "Dinas Pertanian dan Pangan","Dinas Perikanan","Dinas Pemberdayaan Masyarakat dan Desa","Badan Pendapatan Daerah","Kecamatan Kalipuro","Kecamatan Singojuruh",
  "Dinas Pekerjaan Umum Cipta Karya Perumahan dan Permukiman","Dinas Pekerjaan Umum Pengairan","Dinas Pemadam Kebakaran dan Penyelamatan","Kecamatan Muncar","Kecamatan Cluring","Kecamatan Purwoharjo",
  "Dinas Pemuda dan Olah Raga","Dinas Kebudayaan dan Pariwisata","Dinas Koperasi Usaha Mikro dan Perdagangan","Kecamatan Tegaldlimo","Kecamatan Pesanggaran","Kecamatan Bangorejo",
  "Dinas Sosial Pemberdayaan Perempuan dan Keluarga Berencana","Dinas Tenaga Kerja Transmigrasi dan Perindustrian","Dinas Kependudukan dan Pencatatan Sipil","Kecamatan Gambiran","Kecamatan Genteng","Kecamatan Sempu",
  "Badan Perencanaan Pembangunan Daerah","Badan Pengelolaan Keuangan dan Aset Daerah","Badan Kepegawaian Pendidikan dan Pelatihan","Kecamatan Glenmore","Kecamatan Kalibaru","Kecamatan Songgon",
  "Dinas Komunikasi Informatika dan Persandian","Satuan Polisi Pamong Praja","Badan Penanggulangan Bencana Daerah","Badan Kesatuan Bangsa dan Politik","Kecamatan Tegalsari","Kecamatan Siliragung"];
}
function SKPD_KONTAK(){
  return [
  ["Sekretariat Daerah","Jl. Jenderal Ahmad Yani No. 100, Banyuwangi","0333-425001","0333-417437","https://banyuwangikab.go.id","68411"],
  ["Dinas Pendidikan","Jl. K.H. Agus Salim No. 5, Banyuwangi","0333-424680","0333-429080","https://pendidikan.banyuwangikab.go.id","68418"],
  ["Dinas Perpustakaan dan Kearsipan","Jl. Jaksa Agung Suprapto No. 43, Banyuwangi","0333-421197","0333-416532","https://dispusip.banyuwangikab.go.id","68416"],
  ["Kecamatan Licin","Jl. Licin No. 10, Kecamatan Licin","0333-426644","0333-426672","https://licin.banyuwangikab.go.id","68454"],
  ["Kecamatan Blimbingsari","Jl. Pantai Desa Blimbingsari No. 116, Kecamatan Blimbingsari","0333-6370482","0333-6370482","https://blimbingsari.banyuwangikab.go.id","68460"],
  ["Kecamatan Glagah","Jl. Raya Banyuwangi-Licin No. 244, Kecamatan Glagah","0333-421845","","https://glagah.banyuwangikab.go.id","68432"],
  ["Dinas Kesehatan","Jl. Letkol Istiqlah No. 42, Banyuwangi","0333-421779","0333-413173","https://dinkes.banyuwangikab.go.id/portal/","68415"],
  ["Dinas Lingkungan Hidup","Jl. Wijaya Kusuma No. 102, Banyuwangi","0333-424113","0333-424113","https://dlh.banyuwangikab.go.id","68425"],
  ["Dinas Perhubungan","Jl. K.H. Agus Salim No. 83, Banyuwangi","0333-424972","0333-415318","https://dishub.banyuwangikab.go.id","68425"],
  ["Kecamatan Banyuwangi","Jl. Jenderal Ahmad Yani No. 101, Kecamatan Banyuwangi","0333-424232","0333-424232","https://kota.banyuwangikab.go.id","68411"],
  ["Kecamatan Srono","Jl. Raya Srono No. 145, Kecamatan Srono","0333-396245","0333-396245","https://srono.banyuwangikab.go.id","68471"],
  ["Kecamatan Giri","Jl. Letkol Istiqlah No. 123, Kecamatan Giri","0333-424593","","https://giri.banyuwangikab.go.id","68422"],
  ["Sekretariat DPRD","Jl. Adi Sucipto No. 1, Banyuwangi","0333-424845","","https://dprd.banyuwangikab.go.id/v2/","68416"],
  ["Inspektorat","Jl. K.H. Agus Salim No. 81, Banyuwangi","0333-414240","0333-412600","https://inspektorat.banyuwangikab.go.id","68416"],
  ["Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu","Jl. Jenderal Ahmad Yani No. 57, Banyuwangi","0333-412343","0333-412343","https://dpmptspbwi.banyuwangikab.go.id","68416"],
  ["Kecamatan Wongsorejo","Jl. Raya Wongsorejo No. 136, Kecamatan Wongsorejo","0333-461200","0333-461200","https://wongsorejo.banyuwangikab.go.id","68453"],
  ["Kecamatan Kabat","Jl. Raya Kabat No. 280, Kecamatan Kabat","0333-631402","","https://kabat.banyuwangikab.go.id","68461"],
  ["Kecamatan Rogojampi","Jl. P. Diponegoro No. 211, Kecamatan Rogojampi","0333-631201","","https://rogojampi.banyuwangikab.go.id","68462"],
  ["Dinas Pertanian dan Pangan","Jl. Jaksa Agung Suprapto No. 80, Banyuwangi","0333-421665","","https://dinaspertanian.banyuwangikab.go.id","68425"],
  ["Dinas Perikanan","Jl. K.H. Agus Salim No. 106, Banyuwangi","0333-421418","0333-421418","https://dinasperikanan.banyuwangikab.go.id","68425"],
  ["Dinas Pemberdayaan Masyarakat dan Desa","Jl. Adi Sucipto No. 53, Banyuwangi","0333-424445","0333-424445","https://dpmd.banyuwangikab.go.id","68418"],
  ["Badan Pendapatan Daerah","Jl. Jaksa Agung Suprapto No. 140, Banyuwangi","0333-418818","0333-419614","https://bapenda.banyuwangikab.go.id","68425"],
  ["Kecamatan Kalipuro","Jl. Joyoboyo No. 03, Kecamatan Kalipuro","0333-411275","0333-411275","https://kalipuro.banyuwangikab.go.id","68455"],
  ["Kecamatan Singojuruh","Jl. Singojuruh-Gendoh No. 85, Kecamatan Singojuruh","0333-631002","0333-631002","https://singojuruh.banyuwangikab.go.id","68464"],
  ["Dinas Pekerjaan Umum, Cipta Karya, Perumahan dan Permukiman","Jl. H.O.S. Cokroaminoto No. 101, Banyuwangi","0333-421695","0333-410445","https://dinaspu.banyuwangikab.go.id","68432"],
  ["Dinas Pekerjaan Umum Pengairan","Jl. Adi Sucipto No. 84C, Banyuwangi","0333-424676","0333-424676","https://pengairan.banyuwangikab.go.id","68418"],
  ["Dinas Pemadam Kebakaran dan Penyelamatan","Jl. Tiga Berlian, Kelurahan Kepatihan, Kecamatan Banyuwangi","0333-422113","","https://sipp.banyuwangikab.go.id/opd/dinas-pemadam-kebakaran-dan-penyelamatan-kabupaten-banyuwangi","68411"],
  ["Kecamatan Muncar","Jl. Hayam Wuruk No. 14, Kecamatan Muncar","0333-593008","0333-593008","https://muncar.banyuwangikab.go.id","68472"],
  ["Kecamatan Cluring","Jl. Raya Jember No. 34, Kecamatan Cluring","0333-396145","","https://cluring.banyuwangikab.go.id","68482"],
  ["Kecamatan Purwoharjo","Jl. Grajagan No. 45, Kecamatan Purwoharjo","0333-396345","0333-396345","https://purwoharjo.banyuwangikab.go.id","68483"],
  ["Dinas Pemuda dan Olahraga","Jl. Jenderal Ahmad Yani No. 96, Banyuwangi","0333-412100","0333-412100","https://dispora.banyuwangikab.go.id","68411"],
  ["Dinas Kebudayaan dan Pariwisata","Jl. Jenderal Ahmad Yani No. 78, Banyuwangi","0333-424172","0333-412851","https://banyuwangitourism.com","68416"],
  ["Dinas Koperasi, Usaha Mikro dan Perdagangan","Jl. Adi Sucipto No. 76, Banyuwangi","0333-421320","0333-427007","https://diskopumkm.banyuwangikab.go.id","68418"],
  ["Kecamatan Tegaldlimo","Jl. Koptu Ruswadi No. 12, Kecamatan Tegaldlimo","0333-592008","0333-592008","https://tegaldlimo.banyuwangikab.go.id","68484"],
  ["Kecamatan Pesanggaran","Jl. Raya Pancer No. 06, Desa Sumberagung, Kecamatan Pesanggaran","0333-710446","","https://pesanggaran.banyuwangikab.go.id","68488"],
  ["Kecamatan Bangorejo","Jl. Pesanggaran No. 548, Kecamatan Bangorejo","0333-710545","","https://bangorejo.banyuwangikab.go.id","68487"],
  ["Dinas Sosial, Pemberdayaan Perempuan dan Keluarga Berencana","Jl. H.O.S. Cokroaminoto No. 30, Banyuwangi","0333-424506","0333-424506","https://dinsos.banyuwangikab.go.id","68425"],
  ["Dinas Tenaga Kerja, Transmigrasi dan Perindustrian","Jl. K.H. Agus Salim No. 9, Banyuwangi","0333-421135","0333-421135","https://nakertrans.banyuwangikab.go.id","68412"],
  ["Dinas Kependudukan dan Pencatatan Sipil","Jl. Letkol Istiqlah No. 68, Banyuwangi","0333-424234","0333-424234","https://disdukcapil.banyuwangikab.go.id","68415"],
  ["Kecamatan Gambiran","Jl. Ahmad Yani No. 26, Kecamatan Gambiran","0333-845573","","https://gambiran.banyuwangikab.go.id","68486"],
  ["Kecamatan Genteng","Jl. K.H. Hasyim Asy'ari No. 64, Kecamatan Genteng","0333-845617","0333-845617","https://genteng.banyuwangikab.go.id","68465"],
  ["Kecamatan Sempu","Jl. Raya Sempu No. 27, Kecamatan Sempu","0333-846840","","https://sempu.banyuwangikab.go.id","68468"],
  ["Badan Perencanaan Pembangunan Daerah","Jl. Jenderal Ahmad Yani No. 100, Banyuwangi","0333-425001","0333-417437","https://bappeda.banyuwangikab.go.id","68411"],
  ["Badan Pengelolaan Keuangan dan Aset Daerah","Jl. Adi Sucipto No. 28, Banyuwangi","0333-414062","0333-414061","https://bpkad.banyuwangikab.go.id","68416"],
  ["Badan Kepegawaian, Pendidikan dan Pelatihan","Jl. K.H. Agus Salim No. 20A, Banyuwangi","0333-426211","0333-426211","https://bkd.banyuwangikab.go.id","68411"],
  ["Kecamatan Glenmore","Jl. Raya Glenmore No. 89, Kecamatan Glenmore","0333-821445","0333-823135","https://glenmore.banyuwangikab.go.id","68466"],
  ["Kecamatan Kalibaru","Jl. Raya Jember No. 157, Kecamatan Kalibaru","0333-897245","0333-897245","https://kalibaru.banyuwangikab.go.id","68467"],
  ["Kecamatan Songgon","Jl. Jenderal Ahmad Yani No. 287, Kecamatan Songgon","0333-631102","0333-631102","https://songgon.banyuwangikab.go.id","68463"],
  ["Dinas Komunikasi, Informatika dan Persandian","Jl. K.H. Agus Salim No. 85, Banyuwangi","0333-422400","0333-417437","https://diskominfo.banyuwangikab.go.id","68425"],
  ["Satuan Polisi Pamong Praja","Jl. R.A. Kartini No. 56, Banyuwangi","0333-412265","0333-412265","https://satpolpp.banyuwangikab.go.id","68411"],
  ["Badan Penanggulangan Bencana Daerah","Jl. Jaksa Agung Suprapto No. 71, Banyuwangi","0333-415567","0333-415567","https://bpbd.banyuwangikab.go.id","68416"],
  ["Badan Kesatuan Bangsa dan Politik","Jl. K.H. Agus Salim No. 109, Banyuwangi","0333-425119","","https://kesbangpol.banyuwangikab.go.id","68425"],
  ["Kecamatan Tegalsari","Jl. Blokagung No. 62, Kecamatan Tegalsari","0333-821445","0333-823135","https://tegalsari.banyuwangikab.go.id","68485"],
  ["Kecamatan Siliragung","Jl. Bhayangkara No. 16, Kecamatan Siliragung","0333-710483","0333-711672","https://siliragung.banyuwangikab.go.id","68489"]];
}
function getKontak(skpd){
  var c=canon(skpd), all=SKPD_KONTAK();
  for(var i=0;i<all.length;i++) if(canon(all[i][0])===c) return {alamat:all[i][1],telepon:all[i][2],faks:all[i][3],website:all[i][4],kodepos:all[i][5]};
  for(var j=0;j<all.length;j++){ var k=canon(all[j][0]); if(k.indexOf(c)>-1||c.indexOf(k)>-1) return {alamat:all[j][1],telepon:all[j][2],faks:all[j][3],website:all[j][4],kodepos:all[j][5]}; }
  return {alamat:'Banyuwangi',telepon:'',faks:'',website:'',kodepos:''};
}
function SKPD_PIC_MAP(){
   var pic=[
    ['198203252000122002','HAYUNINGTYAS MUMPUNI, S.STP, M.Si.',[1,36,9,45,40,39]],
    ['198905052015021003','BUDI UTOMO, S.Sos',[0,6,7,8,10,11]],
    ['198907082025211003','MUHAMMAD GHOFUR, A.Md',[12,13,14,15,22,23]],
    ['199203312024211003','DINO FAJAR RIZKIAN, S.Kom',[21,44,24,31,16,17]],
    ['199608162025042003','EKA PUTRI MASADI, S.IAN.',[19,25,26,27,28,29]],
    ['200001112025042006','LAUNA NIHLATHUS SALSABILA, S.A.P',[30,18,32,33,34,35]],
    ['199112022025212095','IGA LESTARI, S.E',[37,38,41,4,3,5]],
    ['199406262024212005','AYU PUSPYTA RANY, S.Sos',[42,43,2,20,46,47]],
    ['197010122006041006','SUWANDONO',[48,49,50,51,52,53]]
  ];
  var list=OPD_LIST(), out=[];
  for(var i=0;i<pic.length;i++) for(var j=0;j<pic[i][2].length;j++){
    var idx=pic[i][2][j], nm=list[idx];
    out.push({skpd:nm,pic_nip:pic[i][0],pic_nama:pic[i][1],jenis:jenisSkpd(nm),kode:kodeSkpd(nm),urutan:idx+1}); }
  return out;
}



function jenisSkpd(n){ if(n.indexOf('Kecamatan')===0) return 'Kecamatan'; if(n.indexOf('Badan')===0) return 'Badan'; if(n.indexOf('Sekretariat')===0) return 'Sekretariat'; if(n.indexOf('Inspektorat')===0) return 'Inspektorat'; if(n.indexOf('Satuan')===0) return 'Satuan'; return 'Dinas'; }
function kodeSkpd(n){
  var stop=['dan','untuk','di','yang','dari','daerah'];
  var w=n.replace(/[^a-zA-Z\s]/g,' ').split(/\s+/).filter(function(x){ return x&&stop.indexOf(x.toLowerCase())===-1; });
  var a=''; for(var i=0;i<Math.min(w.length,3);i++) a+=w[i].substring(0,3).toUpperCase();
  return a.substring(0,9);
}
function getOpdUsername(n){ return ('OPD_'+kodeSkpd(n)).substring(0,12); }
function defaultJabatanKepala(skpd){
  var j=jenisSkpd(skpd);
  if(j==='Kecamatan') return 'Camat '+skpd.replace(/^Kecamatan\s+/,'');
  if(skpd==='Sekretariat Daerah') return 'Sekretaris Daerah Kabupaten Banyuwangi';
  if(skpd==='Sekretariat DPRD') return 'Sekretaris DPRD Kabupaten Banyuwangi';
  if(skpd==='Inspektorat') return 'Inspektur Kabupaten Banyuwangi';
  return 'Kepala '+skpd;
}
function defaultJabatanAdmin(skpd){ return 'Pengelola Admin TPP '+skpd; }

//============================================
// SHEET USER
//============================================
function findUserSheet(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), ex=['Data_Users','Data_User','Users','User','data_users','DATA_USERS','Data Users'];
  for(var i=0;i<ex.length;i++){ var s=ss.getSheetByName(ex[i]); if(s) return s; }
  var all=ss.getSheets();
  for(var j=0;j<all.length;j++){ var nm=String(all[j].getName()).toLowerCase().replace(/[\s_\-]/g,''); if(nm==='datausers'||nm==='datauser'||nm==='users'||nm==='user'||nm==='akun') return all[j]; }
  for(var k=0;k<all.length;k++){ var s2=all[k]; if(s2.getLastRow()<1||s2.getLastColumn()<3) continue;
    var h=s2.getRange(1,1,1,s2.getLastColumn()).getValues()[0].map(function(x){ return String(x==null?'':x).toLowerCase().replace(/[\s_\-\.]/g,''); });
    if(h.some(function(x){return x==='role'||x==='peran'||x==='level';})&&h.some(function(x){return x.indexOf('password')>-1||x==='nip'||x==='id';})) return s2; }
  return null;
}
function detectRoleCol(sheet,lastCol){
  var mr=Math.min(sheet.getLastRow(),80); if(mr<2) return -1;
  var v=sheet.getRange(2,1,mr-1,lastCol).getValues(), best=-1, bs=0;
  for(var c=0;c<lastCol;c++){ var sc=0;
    for(var r=0;r<v.length;r++){ var s=String(v[r][c]==null?'':v[r][c]).toLowerCase().replace(/[\s_\-\.\/]/g,''); if(!s||s.length>40) continue;
      if(s==='superadmin'||s==='admin'||s==='teaminternal'||s==='internal'||s==='team'||s==='useropd'||s==='opd'||s==='user') sc+=3;
      else if(s.indexOf('superadmin')>-1||s.indexOf('internal')>-1||s.indexOf('opd')>-1) sc+=2; }
    if(sc>bs){bs=sc;best=c;} }
  return bs>=3?best:-1;
}
function getUserSheetMap(sheet){
  var lc=Math.max(sheet.getLastColumn(),6), hdr=sheet.getRange(1,1,1,lc).getValues()[0];
  var nm=hdr.map(function(x){ return String(x==null?'':x).toLowerCase().replace(/[\s_\-\.]/g,''); });
  function fe(c){ for(var i=0;i<nm.length;i++){ if(!nm[i])continue; for(var j=0;j<c.length;j++) if(nm[i]===c[j]) return i; } return -1; }
  function fc(c){ for(var i=0;i<nm.length;i++){ if(!nm[i])continue; for(var j=0;j<c.length;j++) if(nm[i].indexOf(c[j])>-1) return i; } return -1; }
  var m={nip:fe(['nip','id','userid','iduser','username','user','account','akun','login']),password:fe(['password','pass','sandi','katasandi','pwd']),
    role:fe(['role','peran','level','hakakses','tipe','type','userrole','akses']),nama:fe(['nama','name','namalengkap','fullname','displayname','namapegawai']),
    opd:fe(['opd','opdditangani','unit','unitkerja','skpd','opdunit','wilayah','instansi']),lastChange:fe(['lastpasswordchange','lastchange','terakhirubah','lastupdate','updatedat'])};
  var src='header';
  if(m.nip<0) m.nip=fc(['nip','username','userid','akun']);
  if(m.password<0) m.password=fc(['password','sandi','pwd']);
  if(m.role<0) m.role=fc(['role','peran','level','hakakses']);
  if(m.nama<0) m.nama=fc(['nama','name']);
  if(m.opd<0) m.opd=fc(['opd','skpd','unit','instansi','wilayah']);
  if(m.lastChange<0) m.lastChange=fc(['lastchange','lastpassword','lastupdate']);
  if(m.role<0){ var d=detectRoleCol(sheet,lc); if(d>=0){ m.role=d; src='content'; } }
  if(m.nip<0||m.role<0||m.nama<0){ src='default'; if(m.nip<0)m.nip=0; if(m.password<0)m.password=1; if(m.role<0)m.role=2; if(m.nama<0)m.nama=3; if(m.opd<0)m.opd=4; if(m.lastChange<0)m.lastChange=5; }
  m.lastCol=lc; m.source=src; m.headers=hdr.map(function(x){return String(x==null?'':x);}); m.sheetName=sheet.getName();
  return m;
}
function buildUserRow(m,o){ var w=Math.max(m.lastCol,6), r=[]; for(var i=0;i<w;i++) r[i]='';
  r[m.nip]=o.nip; if(m.password>=0) r[m.password]=o.password; r[m.role]=o.role; r[m.nama]=o.nama;
  if(m.opd>=0) r[m.opd]=o.opd; if(m.lastChange>=0) r[m.lastChange]=new Date(); return r; }
function findUserRow(nip){
  var sh=findUserSheet(); if(!sh||sh.getLastRow()<2) return null;
  var m=getUserSheetMap(sh), d=sh.getRange(2,1,sh.getLastRow()-1,m.lastCol).getValues();
  for(var i=0;i<d.length;i++) if(String(d[i][m.nip]==null?'':d[i][m.nip]).trim()===String(nip).trim())
    return {sheet:sh,map:m,row:i+2,nip:String(d[i][m.nip]).trim(),role:normalizeRole(d[i][m.role]),
      nama:String(d[i][m.nama]==null?'':d[i][m.nama]).trim(),opd:String(m.opd>=0?(d[i][m.opd]==null?'':d[i][m.opd]):'').trim(),raw:d[i]};
  return null;
}
function assertRole(nip,allowed){
  var u=findUserRow(nip); if(!u) throw new Error('Sesi tidak valid. Silakan login ulang.');
  if(allowed.indexOf(u.role)===-1) throw new Error('Akses ditolak. Modul ini khusus '+allowed.map(roleLabel).join(' / ')+'.');
  return u;
}
function getSkpdForActor(nip){
  var u=findUserRow(nip); if(!u) return [];
  if(u.role==='Superadmin') return OPD_LIST();
  if(u.role==='UserOPD') return u.opd?[u.opd]:[];
  var resolved=resolvePICNip(u.nip, u.nama);
  var map=SKPD_PIC_MAP(), out=[];
  for(var i=0;i<map.length;i++) if(resolved && map[i].pic_nip===resolved) out.push(map[i].skpd);
  if(!out.length && u.opd){
    var p=u.opd.split(';');
    for(var j=0;j<p.length;j++){ var t=p[j].trim(); if(t) out.push(t); }
  }
  return out;
}
function ownsSkpd(nip,skpd){ var m=getSkpdForActor(nip), c=canon(skpd); for(var i=0;i<m.length;i++) if(canon(m[i])===c) return true; return false; }
function getPICForSkpd(skpd){
  var c=canon(skpd), map=SKPD_PIC_MAP();
  for(var i=0;i<map.length;i++) if(canon(map[i].skpd)===c) return map[i];
  for(var j=0;j<map.length;j++) if(canon(map[j].skpd).indexOf(c)>-1||c.indexOf(canon(map[j].skpd))>-1) return map[j];
  return {skpd:skpd,pic_nip:'',pic_nama:'-',jenis:jenisSkpd(skpd),kode:kodeSkpd(skpd)};
}


function tampilkanPICMapping(){
  var map=SKPD_PIC_MAP(), byPic={}, hasil='=== PEMBAGIAN WILAYAH PIC (BARU) ===\n\n', no=1;
  for(var i=0;i<map.length;i++){
    if(!byPic[map[i].pic_nip]) byPic[map[i].pic_nip]={nama:map[i].pic_nama,list:[]};
    byPic[map[i].pic_nip].list.push(map[i].skpd);
  }
  for(var k in byPic){
    hasil+=no+'. '+byPic[k].nama+' ('+k+')\n';
    for(var j=0;j<byPic[k].list.length;j++) hasil+='   '+(j+1)+'. '+byPic[k].list[j]+'\n';
    hasil+='\n'; no++;
  }
  hasil+='Total: '+map.length+' SKPD';
  Logger.log(hasil);
  return hasil;
}

function updatePICDanSinkron(){
  try{
    var sh=findUserSheet();
    if(!sh) return 'ERROR: Sheet Data_Users tidak ditemukan.';
    var m=getUserSheetMap(sh);
    if(m.opd<0) return 'ERROR: Kolom OPD tidak terdeteksi pada sheet '+m.sheetName+'.';
    var byPic={}, map=SKPD_PIC_MAP();
    for(var i=0;i<map.length;i++){
      if(!byPic[map[i].pic_nip]) byPic[map[i].pic_nip]={nama:map[i].pic_nama,list:[]};
      byPic[map[i].pic_nip].list.push(map[i].skpd);
    }
    var last=sh.getLastRow();
    if(last<2) return 'ERROR: Sheet Data_Users kosong.';
    var d=sh.getRange(2,1,last-1,m.lastCol).getValues();
    var ch=0, detail=[];
    for(var j=0;j<d.length;j++){
      var nip=String(d[j][m.nip]||'').trim();
      var nama=String(d[j][m.nama]||'').trim();
      if(normalizeRole(d[j][m.role])!=='TeamInternal') continue;
      var rn=resolvePICNip(nip, nama);
      var info=rn?byPic[rn]:null;
      if(!info){ detail.push('LEWATI: '+nip+' ('+nama+') tidak cocok dengan PIC mana pun'); continue; }
      var oldVal=String(d[j][m.opd]||'').trim(), newVal=info.list.join('; ');
      if(oldVal===newVal){ detail.push('SAMA: '+info.nama+' ('+nip+')'); continue; }
      sh.getRange(j+2,m.opd+1).setValue(newVal);
      ch++;
      detail.push('UPDATE: '+nip+' → '+info.nama+'\n  Baru: '+newVal);
    }
    try{ setupSKPDSheet(); detail.push('Sheet Data_SKPD disinkronkan ulang.'); }catch(e){ detail.push('Peringatan Data_SKPD: '+e.message); }
    var hasil='=== SINKRONISASI SELESAI ===\nAkun diperbarui: '+ch+'\n\n'+detail.join('\n\n');
    Logger.log(hasil);
    return hasil;
  }catch(e){
    var msg='ERROR: '+e.message;
    Logger.log(msg);
    return msg;
  }
}



//============================================
// LOG
//============================================
function logSheet(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Log_Aktivitas');
  if(!s){ s=ss.insertSheet('Log_Aktivitas'); s.appendRow(['Timestamp','NIP','Nama','Role','Modul','Aksi','ID_Data','Keterangan']); s.getRange(1,1,1,8).setFontWeight('bold').setBackground('#e0e7ff'); s.setFrozenRows(1); }
  return s;
}
function writeLog(nip,modul,aksi,idData,ket){
  try{ var u=findUserRow(nip); logSheet().appendRow([new Date(),nip,u?u.nama:'-',u?roleLabel(u.role):'-',modul,aksi,idData||'',ket||'']); }catch(e){}
}
function getLogAktivitas(actorNip,limit){
  assertRole(actorNip,['Superadmin']);
  var s=logSheet(); if(s.getLastRow()<2) return [];
  var d=s.getDataRange().getValues(); d.shift();
  return d.reverse().slice(0,limit||300).map(function(r){ return {waktu:r[0]?fmtDT(r[0]):'-',
    nip:String(r[1]||''),nama:String(r[2]||''),role:String(r[3]||''),modul:String(r[4]||''),aksi:String(r[5]||''),id:String(r[6]||''),ket:String(r[7]||'')}; });
}

//============================================
// SETUP
//============================================
function setupDatabase(){
  try{
    var ss=SpreadsheetApp.getActiveSpreadsheet(), todayStr=Utilities.formatDate(new Date(),TZ(),'yyyy-MM-dd');
    var sp=ss.getSheetByName('Data_Pegawai');
    if(!sp){ sp=ss.insertSheet('Data_Pegawai'); sp.appendRow(['NIP','Nama','Pangkat','Jabatan','Tanggal_Lahir','Email']); sp.getRange(1,1,1,6).setFontWeight('bold').setBackground('#eef2ff');
      var pg=[['197806172002121000','DARMAWAN AGUNG NUGROHO, S.Pi','Pembina(IV/a)','Kepala Bagian Organisasi','1978-06-17','darmawan1978.epam@gmail.com'],
        ['198203252000122000','HAYUNINGTYAS MUMPUNI, S.STP, M.Si.','Pembina(IV/a)','JFT- Analis SDM Aparatur Ahli Pertama','1982-03-25','ga12uda25@gmail.com'],
        ['198905052015021000','BUDI UTOMO, S.Sos','Penata(III/c)','JFT- Analis SDM Aparatur Ahli Pertama','1989-05-05','idubtomo@gmail.com'],
        ['197010122006041000','SUWANDONO','Penata Muda Tk. I(III/b)','JP- Pengadministrasi Perkantoran','1970-10-12','anadana701@gmail.com'],
        ['199608162025042000','EKA PUTRI MASADI, S.IAN.','Penata Muda(III/a)','JFT- Analis Kebijakan Ahli Pertama','1996-08-16','ekaputrimsd@gmail.com'],
        ['200001112025042000','LAUNA NIHLATHUS SALSABILA, S.A.P','Penata Muda(III/a)','JFT- Analis Kebijakan Ahli Pertama','2000-01-11','launanihlathussalsabila@gmail.com'],
        ['199203312024211000','DINO FAJAR RIZKIAN, S.Kom','PPPK(IX)','JFT- Pranata Komputer Ahli Pertama','1992-03-31','argyaadhidrawa@gmail.com'],
        ['199406262024212000','AYU PUSPYTA RANY, S.Sos','PPPK(IX)','JP- Penelaah Teknis Kebijakan','1994-06-26','apuspitara@gmail.com'],
        ['198907082025211000','MUHAMMAD GHOFUR, A.Md','PPPK(VII)','Fungsional Tertentu','1989-07-08','kangopar@gmail.com'],
        ['199112022025212000','IGA LESTARI, S.E','-','Fungsional Umum','1991-12-02','igalestari.il@gmail.com']];
      sp.getRange(2,1,pg.length,6).setValues(pg); }
    var su=findUserSheet();
    if(!su){ su=ss.insertSheet('Data_Users'); su.appendRow(['NIP','Password','Role','Nama','OPD_Ditangani','Last_Password_Change']); su.getRange(1,1,1,6).setFontWeight('bold').setBackground('#dbeafe');
      var rows=[['197806172002121000','password123','Superadmin','DARMAWAN AGUNG NUGROHO, S.Pi','All',new Date()]];
      var map=SKPD_PIC_MAP(), byPic={};
      for(var i=0;i<map.length;i++){ if(!byPic[map[i].pic_nip]) byPic[map[i].pic_nip]={nama:map[i].pic_nama,list:[]}; byPic[map[i].pic_nip].list.push(map[i].skpd); }
      for(var k in byPic) rows.push([k,'password123','TeamInternal',byPic[k].nama,byPic[k].list.join('; '),new Date()]);
      su.getRange(2,1,rows.length,6).setValues(rows); }
    setupUserOPD();
    var sl=ss.getSheetByName('Log_Password');
    if(!sl){ sl=ss.insertSheet('Log_Password'); sl.appendRow(['Timestamp','NIP','Nama','Action','IP_Address']); sl.getRange(1,1,1,5).setFontWeight('bold').setBackground('#fee2e2'); }
    logSheet(); setupOtherSheets(ss,todayStr); setupTemplates(); setupBankDataSheet(); setupSKPDSheet(); setupTPPSheets(); setupProfilOPD(); setupTTDSheet();
    getSignSecret();
    try{ getOrCreateMediaFolder(); getBankDataFolder(); getTPPFolder(); getTTDFolder(); getBAFinalFolder(); }catch(e){}
    repairUserSheet();
    var st=getUsersStats(), pa=getPeriodeAktif();
    return 'Setup selesai. '+st.total+' akun ('+st.superadmin+' Superadmin, '+st.internal+' Team Internal, '+st.opd+' User OPD). Tanda tangan elektronik QR & halaman verifikasi publik aktif. Periode aktif TPP: '+pa.label+'. URL verifikasi: '+getWebAppUrl();
  }catch(e){ Logger.log('setupDatabase: '+e+'\n'+e.stack); return 'Error: '+e.message; }
}
function setupUserOPD(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), sh=findUserSheet();
  if(!sh){ sh=ss.insertSheet('Data_Users'); sh.appendRow(['NIP','Password','Role','Nama','OPD_Ditangani','Last_Password_Change']);
    sh.appendRow(['197806172002121000','password123','Superadmin','DARMAWAN AGUNG NUGROHO, S.Pi','All',new Date()]); }
  var m=getUserSheetMap(sh), ex={}, d=sh.getRange(2,1,Math.max(sh.getLastRow()-1,1),m.lastCol).getValues();
  for(var i=0;i<d.length;i++) ex[String(d[i][m.nip]==null?'':d[i][m.nip]).trim()]=true;
  var rows=[], list=OPD_LIST();
  for(var j=0;j<list.length;j++){ var un=getOpdUsername(list[j])+'_'+(j+1);
    if(!ex[un]){ rows.push(buildUserRow(m,{nip:un,password:'password123',role:'UserOPD',nama:'Admin '+list[j],opd:list[j]})); ex[un]=true; } }
  if(rows.length) sh.getRange(sh.getLastRow()+1,1,rows.length,m.lastCol).setValues(rows);
  return rows.length;
}
function countOpdUsers(){ return getUsersStats().opd; }
function setupOtherSheets(ss,todayStr){
  var sa=ss.getSheetByName('Data_Agenda');
  if(!sa){ sa=ss.insertSheet('Data_Agenda'); sa.appendRow(['ID','Tanggal_Mulai','Tanggal_Selesai','Waktu_Mulai','Nama_Kegiatan','Lokasi','PJ_NIP','PJ_Nama','Keterangan','Tanggal_Input']); sa.getRange(1,1,1,10).setFontWeight('bold').setBackground('#eef2ff');
    sa.getRange(2,1,2,10).setValues([['AGD-'+Utilities.getUuid().substring(0,6),todayStr,todayStr,'09:00','Rapat Koordinasi Bulanan','Ruang Rapat Utama','','','Evaluasi program kerja bagian',new Date()],
      ['AGD-'+Utilities.getUuid().substring(0,6),todayStr,todayStr,'13:30','Sosialisasi Aplikasi KENDALI','Aula Setda','199203312024211000,199406262024212000','DINO FAJAR RIZKIAN, S.Kom, AYU PUSPYTA RANY, S.Sos','Sosialisasi ke seluruh staf',new Date()]]); }
  var sn=ss.getSheetByName('Data_Notulen');
  if(!sn){ sn=ss.insertSheet('Data_Notulen'); sn.appendRow(['ID','Tanggal_Rapat','Nama_Rapat','Lokasi','Pimpinan_Rapat','Notulis_NIP','Notulis_Nama','Peserta','Agenda','Pembahasan','Tindak_Lanjut','Media_URLs','Tanggal_Input']); sn.getRange(1,1,1,13).setFontWeight('bold').setBackground('#fdf2f8');
    sn.appendRow(['NOT-'+Utilities.getUuid().substring(0,6),todayStr,'Rapat Koordinasi Bulanan','Ruang Rapat Utama','DARMAWAN AGUNG NUGROHO, S.Pi','198203252000122000','HAYUNINGTYAS MUMPUNI, S.STP, M.Si.','DARMAWAN AGUNG NUGROHO, BUDI UTOMO, SUWANDONO','1. Evaluasi Kinerja\n2. Penyusunan Program','1. Kinerja meningkat 15%','1. Pengajuan pengadaan komputer (H+3)','[]',new Date()]); }
}
function setupTemplates(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Data_Templates');
  if(s){ try{ ss.deleteSheet(s); }catch(e){} }
  s=ss.insertSheet('Data_Templates');
  s.appendRow(['ID','Nama_Template','Kategori','Icon','Deskripsi','Peserta_Default','Agenda_Default','Pembahasan_Default','Tindak_Lanjut_Default']);
  s.getRange(1,1,1,9).setFontWeight('bold').setBackground('#fef3c7');
  var t=[['TPL-001','Rapat Koordinasi Bulanan','Koordinasi','📋','Rapat rutin bulanan evaluasi kinerja','Seluruh Kepala Bidang','1. Evaluasi Kinerja\n2. Laporan Realisasi','1. Kinerja mencapai target\n2. Kendala: [sebutkan]','1. [Pegawai] menyusun laporan (H+3)'],
    ['TPL-002','Rapat Teknis','Teknis','⚙️','Pembahasan teknis program','Tim Teknis','1. Pembahasan Teknis\n2. Review Dokumen','1. Dokumen direview\n2. Solusi: [sebutkan]','1. Revisi dokumen (H+3)'],
    ['TPL-003','Sosialisasi','Sosialisasi','📢','Sosialisasi program ke stakeholder','Seluruh Staf','1. Pembukaan\n2. Pemaparan Materi','1. Materi disampaikan\n2. Antusiasme tinggi','1. Distribusi materi (H+1)'],
    ['TPL-004','Kunjungan Kerja Lapangan','Lapangan','🌍','Monitoring/evaluasi di lapangan','Tim Monitoring','1. Observasi Lapangan\n2. Wawancara Petugas','1. Progress fisik [X]%','1. Laporan kunjungan (H+3)'],
    ['TPL-005','Briefing Pagi','Briefing','☀️','Briefing singkat pagi harian','Seluruh Staf','1. Review Agenda Hari Ini\n2. Pembagian Tugas','1. Agenda hari ini: [sebutkan]','1. Pelaksanaan tugas'],
    ['TPL-006','Rapat Evaluasi Kinerja','Evaluasi','📊','Evaluasi kinerja triwulan/semester','Seluruh Pejabat','1. Laporan Kinerja\n2. Analisis Capaian','1. Capaian: [X]%','1. Rencana perbaikan (H+7)'],
    ['TPL-007','Rapat Persiapan Kegiatan','Persiapan','🎯','Persiapan kegiatan/event','Panitia Kegiatan','1. Pembentukan Panitia\n2. Pembagian Tugas','1. Struktur panitia disepakati','1. Rencana kerja per seksi (H+3)'],
    ['TPL-008','Rapat Dengar Pendapat','Dengar Pendapat','🎤','Menampung aspirasi stakeholder','Pimpinan, Stakeholder','1. Pembukaan\n2. Pemaparan Stakeholder','1. Aspirasi: [sebutkan]','1. Rekap aspirasi (H+3)']];
  s.getRange(2,1,t.length,9).setValues(t);
}
function getTemplates(){
  try{ var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_Templates'); if(!s||s.getLastRow()<2) return [];
    var d=s.getDataRange().getValues(); d.shift();
    return d.map(function(r){ return {id:String(r[0]||''),nama:String(r[1]||''),kategori:String(r[2]||''),icon:String(r[3]||'📋'),deskripsi:String(r[4]||''),peserta:String(r[5]||''),agenda:String(r[6]||''),pembahasan:String(r[7]||''),tindak_lanjut:String(r[8]||'')}; });
  }catch(e){ return []; }
}
function setupSKPDSheet(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Data_SKPD'), map=SKPD_PIC_MAP();
  if(!s) s=ss.insertSheet('Data_SKPD');
  s.getRange(1,1,1,11).setValues([['No','SKPD','Kode','Jenis','PIC_NIP','PIC_Nama','Alamat','Telepon','Faks','Website','Kode_Pos']]).setFontWeight('bold').setBackground('#dcfce7');
  var rows=[];
  for(var i=0;i<map.length;i++){ var k=getKontak(map[i].skpd);
    rows.push([i+1,map[i].skpd,map[i].kode,map[i].jenis,map[i].pic_nip,map[i].pic_nama,k.alamat,k.telepon,k.faks,k.website,k.kodepos]); }
  if(s.getLastRow()>1) s.getRange(2,1,s.getLastRow()-1,Math.max(s.getLastColumn(),11)).clearContent();
  s.getRange(2,1,rows.length,11).setValues(rows); s.setFrozenRows(1);
  return s;
}
function getSKPDMaster(actorNip){
  var u=findUserRow(actorNip); if(!u) return [];
  var mine=getSkpdForActor(actorNip), set={}; for(var i=0;i<mine.length;i++) set[canon(mine[i])]=true;
  var map=SKPD_PIC_MAP(), out=[];
  for(var j=0;j<map.length;j++) if(u.role==='Superadmin'||set[canon(map[j].skpd)]){
    var o={},k; for(k in map[j]) o[k]=map[j][k];
    var kk=getKontak(map[j].skpd); for(k in kk) o[k]=kk[k]; out.push(o); }
  return out;
}

//============================================
// PROFIL OPD
//============================================
function getTTDFolder(){ var f=DriveApp.getFoldersByName('KENDALI_TandaTangan'); return f.hasNext()?f.next():DriveApp.createFolder('KENDALI_TandaTangan'); }
function getBAFinalFolder(){ var f=DriveApp.getFoldersByName('KENDALI_BA_Final'); return f.hasNext()?f.next():DriveApp.createFolder('KENDALI_BA_Final'); }
function setupProfilOPD(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Profil_OPD'), list=OPD_LIST(), cfg=getTPPConfigRaw_();
  var defMet=normMetode(cfg.METODE_TTD_DEFAULT||'ELEKTRONIK');
  function blank(nm){ return [nm,kodeSkpd(nm),defaultJabatanAdmin(nm),'','','','',0,0,defMet,defaultJabatanKepala(nm),'','','','',0,0,defMet,'','','']; }
  if(!s){
    s=ss.insertSheet('Profil_OPD');
    s.getRange(1,1,1,21).setValues([PROFIL_HEAD]).setFontWeight('bold').setBackground('#fef9c3'); s.setFrozenRows(1);
    var rows=[]; for(var i=0;i<list.length;i++) rows.push(blank(list[i]));
    s.getRange(2,1,rows.length,21).setValues(rows); return s;
  }
  var lc=s.getLastColumn(), lr=s.getLastRow();
  var hdr=lr>=1?s.getRange(1,1,1,Math.max(lc,1)).getValues()[0].map(function(x){return String(x==null?'':x);}):[];
  if(lc<21||hdr.indexOf('Admin_Metode')===-1||hdr.indexOf('Kepala_Metode')===-1){
    var idx={}; for(var h=0;h<hdr.length;h++) idx[hdr[h]]=h;
    var old=lr>1?s.getRange(2,1,lr-1,Math.max(lc,1)).getValues():[];
    var byKey={};
    for(var j=0;j<old.length;j++){
      var key=canon(old[j][0]); if(!key) continue;
      function g(n){ var i2=idx[n]; return i2===undefined?'':old[j][i2]; }
      byKey[key]={aj:g('Admin_Jabatan'),an:g('Admin_Nama'),ai:g('Admin_NIP'),ap:g('Admin_Pangkat'),
        at:g('Admin_TTD_ID')||g('TTD_File_ID'),aw:g('Admin_TTD_W')||g('TTD_W')||0,ah:g('Admin_TTD_H')||g('TTD_H')||0,am:g('Admin_Metode'),
        kj:g('Kepala_Jabatan'),kn:g('Kepala_Nama'),ki:g('Kepala_NIP'),kp:g('Kepala_Pangkat'),
        kt:g('Kepala_TTD_ID'),kw:g('Kepala_TTD_W')||0,kh:g('Kepala_TTD_H')||0,km:g('Kepala_Metode'),ph:g('Kepala_Pin_Hash'),up:g('Updated'),ub:g('Updated_By')};
    }
    s.clear();
    s.getRange(1,1,1,21).setValues([PROFIL_HEAD]).setFontWeight('bold').setBackground('#fef9c3'); s.setFrozenRows(1);
    var mig=[];
    for(var m=0;m<list.length;m++){ var nm=list[m],o=byKey[canon(nm)];
      if(!o){ mig.push(blank(nm)); continue; }
      mig.push([nm,kodeSkpd(nm),o.aj||defaultJabatanAdmin(nm),o.an,o.ai,o.ap,o.at,Number(o.aw||0),Number(o.ah||0),normMetode(o.am||defMet),
        o.kj||defaultJabatanKepala(nm),o.kn,o.ki,o.kp,o.kt,Number(o.kw||0),Number(o.kh||0),normMetode(o.km||defMet),o.ph,o.up,o.ub]); }
    s.getRange(2,1,mig.length,21).setValues(mig); return s;
  }
  var have={}, last=s.getLastRow();
  if(last>1){ var d=s.getRange(2,1,last-1,1).getValues(); for(var k2=0;k2<d.length;k2++) have[canon(d[k2][0])]=true; }
  var add=[]; for(var n=0;n<list.length;n++) if(!have[canon(list[n])]) add.push(blank(list[n]));
  if(add.length) s.getRange(last+1,1,add.length,21).setValues(add);
  return s;
}
function getTPPConfigRaw_(){
  var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config_TPP'), out={};
  if(s&&s.getLastRow()>1){ var d=s.getRange(2,1,s.getLastRow()-1,3).getValues(); for(var i=0;i<d.length;i++) out[String(d[i][0])]=String(d[i][1]==null?'':d[i][1]); }
  return out;
}
function readProfilRow(skpd){
  var s=setupProfilOPD(); if(s.getLastRow()<2) return null;
  var d=s.getRange(2,1,s.getLastRow()-1,21).getValues(), c=canon(skpd);
  for(var i=0;i<d.length;i++) if(canon(d[i][0])===c) return {sheet:s,row:i+2,data:d[i]};
  return null;
}
function sigFromDrive(id){
  if(!id) return '';
  try{ var b=DriveApp.getFileById(id).getBlob(); return 'data:'+b.getContentType()+';base64,'+Utilities.base64Encode(b.getBytes()); }catch(e){ return ''; }
}
function profilObj(d,withSig){
  var at=String(d[6]||''), kt=String(d[14]||'');
  var o={skpd:String(d[0]||''),kode:String(d[1]||''),
    admin:{jabatan:String(d[2]||''),nama:String(d[3]||''),nip:String(d[4]||''),pangkat:String(d[5]||''),ttd_file_id:at,ttd_w:Number(d[7]||0),ttd_h:Number(d[8]||0),metode:normMetode(d[9]),ttd_dataurl:''},
    kepala:{jabatan:String(d[10]||''),nama:String(d[11]||''),nip:String(d[12]||''),pangkat:String(d[13]||''),ttd_file_id:kt,ttd_w:Number(d[15]||0),ttd_h:Number(d[16]||0),metode:normMetode(d[17]),ttd_dataurl:'',has_pin:!!String(d[18]||'')},
    updated:d[19]?fmtDT(d[19]):'',updated_by:String(d[20]||'')};
  if(withSig){ o.admin.ttd_dataurl=sigFromDrive(at); o.kepala.ttd_dataurl=sigFromDrive(kt);
    if(at&&!o.admin.ttd_dataurl) o.admin.ttd_file_id='';
    if(kt&&!o.kepala.ttd_dataurl) o.kepala.ttd_file_id=''; }
  o.lengkap=!!(o.admin.nama&&o.admin.nip&&o.admin.pangkat&&o.kepala.nama&&o.kepala.nip&&o.kepala.pangkat);
  return o;
}
function getProfilOPD(skpd,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(u.role!=='Superadmin'&&!ownsSkpd(actorNip,skpd)) return {success:false,message:'Profil SKPD ini hanya dapat diisi oleh admin OPD yang bersangkutan.'};
    var r=readProfilRow(skpd); if(!r) return {success:false,message:'Profil SKPD belum tersedia. Jalankan setupDatabase().'};
    return {success:true,profil:profilObj(r.data,true),kontak:getKontak(skpd),pic:getPICForSkpd(skpd),config:getTPPConfig(),
      diisiOleh:u.role==='UserOPD'?'Admin OPD '+skpd:roleLabel(u.role),akunNama:u.nama,appUrl:getWebAppUrl()};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function saveProfilOPD(obj,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(u.role!=='Superadmin'&&!ownsSkpd(actorNip,obj.skpd)) return {success:false,message:'Hanya admin OPD '+obj.skpd+' yang dapat mengisi data ini.'};
    var r=readProfilRow(obj.skpd); if(!r) return {success:false,message:'Profil SKPD tidak ditemukan.'};
    var a=obj.admin||{},k=obj.kepala||{};
    if(!String(a.nama||'').trim()||!String(a.nip||'').trim()||!String(a.pangkat||'').trim())
      return {success:false,message:'Nama, NIP, dan Pangkat/Golongan Pengelola Admin wajib diisi.'};
    if(!String(k.nama||'').trim()||!String(k.nip||'').trim()||!String(k.pangkat||'').trim())
      return {success:false,message:'Nama, NIP, dan Pangkat/Golongan Kepala OPD wajib diisi.'};
    var pin=String(r.data[18]||'');
    if(k.pinClear===true) pin='';
    else if(String(k.pin||'').trim()){
      if(String(k.pin).trim().length<4) return {success:false,message:'PIN persetujuan minimal 4 digit.'};
      pin=pinHash(obj.skpd,String(k.pin).trim());
    }
    r.sheet.getRange(r.row,3,1,4).setValues([[String(a.jabatan||defaultJabatanAdmin(obj.skpd)).trim(),String(a.nama).trim(),String(a.nip).trim(),String(a.pangkat).trim()]]);
    r.sheet.getRange(r.row,10).setValue(normMetode(a.metode));
    r.sheet.getRange(r.row,11,1,4).setValues([[String(k.jabatan||defaultJabatanKepala(obj.skpd)).trim(),String(k.nama).trim(),String(k.nip).trim(),String(k.pangkat).trim()]]);
    r.sheet.getRange(r.row,18,1,2).setValues([[normMetode(k.metode),pin]]);
    r.sheet.getRange(r.row,20,1,2).setValues([[new Date(),u.nama]]);
    writeLog(actorNip,'Profil OPD','Simpan Identitas',obj.skpd,'Admin: '+a.nama+' ('+normMetode(a.metode)+') • Kepala: '+k.nama+' ('+normMetode(k.metode)+')');
    return {success:true,message:'Identitas & metode tanda tangan '+obj.skpd+' berhasil disimpan.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function saveSignatureOPD(skpd,target,base64,filename,w,h,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(u.role!=='Superadmin'&&!ownsSkpd(actorNip,skpd)) return {success:false,message:'Hanya admin OPD '+skpd+' yang dapat menyimpan tanda tangan ini.'};
    var r=readProfilRow(skpd); if(!r) return {success:false,message:'Profil SKPD tidak ditemukan.'};
    if(!base64) return {success:false,message:'Data tanda tangan kosong.'};
    if(base64.length>400000) return {success:false,message:'Ukuran tanda tangan terlalu besar.'};
    var isKep=String(target).toLowerCase()==='kepala';
    var col=isKep?15:7, oldCol=isKep?14:6;
    var old=String(r.data[oldCol]||'');
    var file=getTTDFolder().createFile(Utilities.newBlob(Utilities.base64Decode(base64),'image/png',filename||('TTD_'+(isKep?'Kepala':'Admin')+'_'+kodeSkpd(skpd)+'.png')));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    r.sheet.getRange(r.row,col,1,3).setValues([[file.getId(),Number(w||0),Number(h||0)]]);
    r.sheet.getRange(r.row,20,1,2).setValues([[new Date(),u.nama]]);
    if(old){ try{ DriveApp.getFileById(old).setTrashed(true); }catch(e){} }
    writeLog(actorNip,'Profil OPD','Simpan TTD Manual '+(isKep?'Kepala':'Admin'),skpd,'Gambar tanda tangan manual diperbarui');
    return {success:true,file_id:file.getId(),ttd_dataurl:'data:image/png;base64,'+base64,message:'Gambar tanda tangan manual '+(isKep?'Kepala OPD':'Pengelola Admin')+' tersimpan.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function deleteSignatureOPD(skpd,target,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(u.role!=='Superadmin'&&!ownsSkpd(actorNip,skpd)) return {success:false,message:'Tidak berwenang.'};
    var r=readProfilRow(skpd); if(!r) return {success:false,message:'Profil SKPD tidak ditemukan.'};
    var isKep=String(target).toLowerCase()==='kepala';
    var old=String(r.data[isKep?14:6]||'');
    if(old){ try{ DriveApp.getFileById(old).setTrashed(true); }catch(e){} }
    r.sheet.getRange(r.row,isKep?15:7,1,3).setValues([['',0,0]]);
    r.sheet.getRange(r.row,20,1,2).setValues([[new Date(),u.nama]]);
    writeLog(actorNip,'Profil OPD','Hapus TTD Manual '+(isKep?'Kepala':'Admin'),skpd,'Gambar tanda tangan manual dihapus');
    return {success:true,message:'Gambar tanda tangan manual dihapus. Mode manual akan menampilkan "ttd.".'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getLogoKop(){
  try{
    var cache=CacheService.getScriptCache(), hit=cache.get('kop_logo_v1');
    if(hit){ try{ return JSON.parse(hit); }catch(e){} }
    var f=DriveApp.getFileById(LOGO_KOP_ID), b=f.getBlob(), mime=b.getContentType();
    var out={success:true,mime:mime,dataurl:'data:'+mime+';base64,'+Utilities.base64Encode(b.getBytes())};
    try{ cache.put('kop_logo_v1',JSON.stringify(out),21600); }catch(e){}
    return out;
  }catch(e){ return {success:false,message:'Logo kop tidak dapat dibaca: '+e.message}; }
}

//============================================
// TANDA TANGAN ELEKTRONIK (QR)
//============================================
function setupTTDSheet(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('TTD_Elektronik');
  if(!s){
    s=ss.insertSheet('TTD_Elektronik');
    s.getRange(1,1,1,21).setValues([SIG_HEAD]).setFontWeight('bold').setBackground('#e0e7ff'); s.setFrozenRows(1);
    return s;
  }
  var lc=s.getLastColumn();
  if(lc<21){
    var hdr=s.getRange(1,1,1,Math.max(lc,1)).getValues()[0].map(function(x){return String(x==null?'':x);});
    var idx={}; for(var h=0;h<hdr.length;h++) idx[hdr[h]]=h;
    var old=s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,Math.max(lc,1)).getValues():[];
    s.clear();
    s.getRange(1,1,1,21).setValues([SIG_HEAD]).setFontWeight('bold').setBackground('#e0e7ff'); s.setFrozenRows(1);
    if(old.length){
      var mig=[];
      for(var i=0;i<old.length;i++){
        var row=[];
        for(var c=0;c<21;c++){
          var nm=SIG_HEAD[c], j=idx[nm];
          if(nm==='Waktu_ISO'){
            var w=idx['Waktu']!==undefined?old[i][idx['Waktu']]:'';
            row.push(w?new Date(w).toISOString():'');
          } else {
            row.push(j===undefined?'':old[i][j]);
          }
        }
        mig.push(row);
      }
      s.getRange(2,1,mig.length,21).setValues(mig);
    }
  }
  return s;
}
function sigObj(d,row){
  var w=d[13], p=dtParts(w);
  var waktuISO=String(d[20]||'');
  if(!waktuISO&&w){ try{ waktuISO=new Date(w).toISOString(); }catch(e){ waktuISO=''; } }
  return {id:String(d[0]||''),token:String(d[1]||''),hash:String(d[2]||''),jenis:String(d[3]||''),idDok:String(d[4]||''),
    nomor:String(d[5]||''),skpd:String(d[6]||''),periode:String(d[7]||''),peran:String(d[8]||''),
    nip:String(d[9]||''),nama:String(d[10]||''),pangkat:String(d[11]||''),jabatan:String(d[12]||''),
    waktu:fmtDT(w),waktuISO:waktuISO,tgl:p.tgl,jam:p.jam,tglPanjang:tglPanjang(w),
    metode:String(d[14]||'ELEKTRONIK'),operatorNip:String(d[15]||''),operatorNama:String(d[16]||''),
    status:String(d[17]||'PENDING'),fileId:String(d[18]||''),url:String(d[19]||''),rowIndex:row||0};
}
function readSignaturesMap(){
  var s=setupTTDSheet(), map={};
  if(s.getLastRow()<2) return map;
  var d=s.getRange(2,1,s.getLastRow()-1,20).getValues();
  for(var i=0;i<d.length;i++){
    var id=String(d[i][4]||''); if(!id) continue;
    if(!map[id]) map[id]=[];
    map[id].push(sigObj(d[i],i+2)); }
  return map;
}
function findSignatureByToken(token){
  var s=setupTTDSheet(); if(s.getLastRow()<2) return null;
  var d=s.getRange(2,1,s.getLastRow()-1,20).getValues(), t=String(token||'').trim().toUpperCase();
  for(var i=0;i<d.length;i++) if(String(d[i][1]).toUpperCase()===t) return sigObj(d[i],i+2);
  return null;
}
function verifyUrl(token){
  var base=getWebAppUrl(); if(!base) return '';
  return base+(base.indexOf('?')>-1?'&':'?')+'verifikasi='+encodeURIComponent(token);
}
function qrFallbackText(o){
  return 'TANDA TANGAN ELEKTRONIK KENDALI\nDokumen: '+o.nomor+'\nSKPD: '+o.skpd+'\nPeriode: '+o.periode+
    '\nPeran: '+o.peranLabel+'\nNama: '+o.nama+'\nPangkat/Golongan: '+o.pangkat+'\nNIP: '+o.nip+
    '\nJabatan: '+o.jabatan+'\nDitandatangani: '+o.tglPanjang+' pukul '+o.jam+' WIB\nKode: '+o.token+'\nSidik digital: '+o.hash.substring(0,32);
}
function createSignature(rec,nomor,periode,peran,person,actor){
  var s=setupTTDSheet(), token=newToken(), now=new Date();
  var peranLabel=peran==='KEPALA'?'Kepala OPD':'Pengelola Admin TPP';
  var o={token:token,jenis:'BA-TPP',idDok:rec.id,nomor:nomor,skpd:rec.skpd,periode:periode,peran:peran,
    nip:person.nip,nama:person.nama,pangkat:person.pangkat,jabatan:person.jabatan,
    waktuISO:now.toISOString(),operatorNip:actor.nip};
    var hash=sigHash(o), url=verifyUrl(token), p=dtParts(now), isoNow=now.toISOString();
  s.appendRow([rec.id+'-'+peran+'-'+token,token,hash,'BA-TPP',rec.id,nomor,rec.skpd,periode,peran,
    person.nip,person.nama,person.pangkat,person.jabatan,now,'ELEKTRONIK',actor.nip,actor.nama,'PENDING','',url,isoNow]);
  var out={id:rec.id+'-'+peran+'-'+token,token:token,hash:hash,peran:peran,peranLabel:peranLabel,
    nip:person.nip,nama:person.nama,pangkat:person.pangkat,jabatan:person.jabatan,
    waktu:fmtDT(now),tgl:p.tgl,jam:p.jam,tglPanjang:tglPanjang(now),url:url,status:'PENDING',
    operatorNama:actor.nama,operatorNip:actor.nip};
  out.qrPayload=url||qrFallbackText(out);
  out.qrIsUrl=!!url;
  return out;
}
function activateSignatures(tokens,fileId,actorNip){
  var s=setupTTDSheet(); if(s.getLastRow()<2) return;
  var set={}; for(var i=0;i<tokens.length;i++) set[String(tokens[i]).toUpperCase()]=true;
  var d=s.getRange(2,1,s.getLastRow()-1,20).getValues();
  for(var j=0;j<d.length;j++) if(set[String(d[j][1]).toUpperCase()]){
    s.getRange(j+2,18,1,2).setValues([['AKTIF',fileId]]); }
}
function retireSignatures(idDok,peran,keepTokens){
  var s=setupTTDSheet(); if(s.getLastRow()<2) return;
  var keep={}; for(var i=0;i<keepTokens.length;i++) keep[String(keepTokens[i]).toUpperCase()]=true;
  var d=s.getRange(2,1,s.getLastRow()-1,20).getValues();
  for(var j=0;j<d.length;j++){
    if(String(d[j][4])!==String(idDok)) continue;
    if(peran&&String(d[j][8])!==peran) continue;
    var tk=String(d[j][1]).toUpperCase();
    if(keep[tk]) continue;
    if(String(d[j][17])==='DICABUT') continue;
    s.getRange(j+2,18).setValue('DICABUT'); }
}
function revokeSignature(token,actorNip){
  try{
    assertRole(actorNip,['Superadmin']);
    var s=setupTTDSheet(); if(s.getLastRow()<2) return {success:false,message:'Belum ada tanda tangan.'};
    var d=s.getRange(2,1,s.getLastRow()-1,20).getValues();
    for(var j=0;j<d.length;j++) if(String(d[j][1]).toUpperCase()===String(token).toUpperCase()){
      s.getRange(j+2,18).setValue('DICABUT');
      writeLog(actorNip,'TPP','Cabut Tanda Tangan Elektronik',String(d[j][4]),String(d[j][6])+' • '+String(d[j][10])+' • token '+token);
      return {success:true,message:'Tanda tangan elektronik '+token+' dicabut. Halaman verifikasi akan menampilkan status DICABUT.'}; }
    return {success:false,message:'Token tidak ditemukan.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getSignatures(idDok,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return [];
    var map=readSignaturesMap(); return map[idDok]||[];
  }catch(e){ return []; }
}
function getVerificationPage(token){
  var sig=findSignatureByToken(token);
  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,system-ui,-apple-system,Arial,sans-serif;background:#eef2ff;color:#0f172a;padding:16px;line-height:1.55}'+
    '.wrap{max-width:620px;margin:0 auto}.card{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.10);overflow:hidden;border:1px solid #e2e8f0}'+
    '.hd{background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);color:#fff;padding:22px 20px;text-align:center}'+
    '.hd h1{font-size:19px;font-weight:800;letter-spacing:.5px}.hd p{font-size:12px;opacity:.92;margin-top:4px}'+
    '.st{padding:14px 20px;text-align:center;font-weight:800;font-size:15px;letter-spacing:.4px}'+
    '.ok{background:#dcfce7;color:#15803d}.warn{background:#fef3c7;color:#92400e}.bad{background:#fee2e2;color:#b91c1c}'+
    '.bd{padding:20px}.sec{margin-bottom:16px}.sec h2{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:800;margin-bottom:8px}'+
    'table{width:100%;border-collapse:collapse}td{padding:6px 0;font-size:14px;vertical-align:top}td.k{width:132px;color:#64748b;font-size:13px}td.v{font-weight:600}'+
    '.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px}'+
    '.mono{font-family:ui-monospace,Consolas,monospace;font-size:11px;word-break:break-all;color:#475569}'+
    '.ft{background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 20px;text-align:center;font-size:11px;color:#64748b}'+
    '.btn{display:inline-block;margin-top:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:700;font-size:13px}'+
    '.note{font-size:12px;color:#475569;background:#eef2ff;border-left:3px solid #6366f1;padding:10px 12px;border-radius:8px}';
  var body='';
  if(!sig){
    body='<div class="st bad">TANDA TANGAN TIDAK DITEMUKAN</div><div class="bd"><div class="note">Kode verifikasi <strong>'+esc(token)+'</strong> tidak terdaftar pada sistem KENDALI. Dokumen yang memuat kode ini tidak dapat dipastikan keasliannya. Hubungi Bagian Organisasi Sekretariat Daerah Kabupaten Banyuwangi.</div></div>';
  } else {
      var recomputed=sigHash({token:sig.token,jenis:sig.jenis,idDok:sig.idDok,nomor:sig.nomor,skpd:sig.skpd,periode:sig.periode,peran:sig.peran,
    nip:sig.nip,nama:sig.nama,pangkat:sig.pangkat,jabatan:sig.jabatan,waktuISO:sig.waktuISO||'',operatorNip:sig.operatorNip||''});
    var utuh=(recomputed===sig.hash);
    var stCls=sig.status==='AKTIF'?(utuh?'ok':'bad'):(sig.status==='DICABUT'?'bad':'warn');
    var stTxt=sig.status==='AKTIF'?(utuh?'✔ TANDA TANGAN ELEKTRONIK VALID':'✖ DATA TIDAK UTUH'):(sig.status==='DICABUT'?'✖ TANDA TANGAN DICABUT':'… MENUNGGU PENETAPAN DOKUMEN');
    var peranLabel=sig.peran==='KEPALA'?'Kepala OPD (Mengetahui)':'Pengelola Admin TPP (Yang Menyatakan Setuju)';
    body='<div class="st '+stCls+'">'+stTxt+'</div><div class="bd">'+
      '<div class="sec"><h2>Penanda Tangan</h2><table>'+
      '<tr><td class="k">Nama</td><td class="v">'+esc(sig.nama)+'</td></tr>'+
      '<tr><td class="k">Pangkat/Golongan</td><td class="v">'+esc(sig.pangkat)+'</td></tr>'+
      '<tr><td class="k">NIP</td><td class="v">'+esc(sig.nip)+'</td></tr>'+
      '<tr><td class="k">Jabatan</td><td class="v">'+esc(sig.jabatan)+'</td></tr>'+
      '<tr><td class="k">Peran</td><td class="v">'+esc(peranLabel)+'</td></tr></table></div>'+
      '<div class="sec"><h2>Waktu Penandatanganan</h2><div class="box"><p style="font-weight:700;font-size:15px">'+esc(sig.tglPanjang)+'</p>'+
      '<p style="font-size:13px;color:#475569;margin-top:2px">Pukul '+esc(sig.jam)+' WIB ('+esc(sig.waktu)+')</p></div></div>'+
      '<div class="sec"><h2>Dokumen</h2><table>'+
      '<tr><td class="k">Jenis</td><td class="v">Berita Acara Persetujuan TPP</td></tr>'+
      '<tr><td class="k">Nomor</td><td class="v">'+esc(sig.nomor)+'</td></tr>'+
      '<tr><td class="k">Perangkat Daerah</td><td class="v">'+esc(sig.skpd)+'</td></tr>'+
      '<tr><td class="k">Periode</td><td class="v">'+esc(sig.periode)+'</td></tr></table></div>'+
      '<div class="sec"><h2>Jejak Sistem</h2><table>'+
      '<tr><td class="k">Diproses oleh</td><td class="v">'+esc(sig.operatorNama)+'</td></tr>'+
      '<tr><td class="k">NIP Operator</td><td class="v">'+esc(sig.operatorNip)+'</td></tr>'+
      '<tr><td class="k">Kode Verifikasi</td><td class="v mono">'+esc(sig.token)+'</td></tr></table>'+
      '<div class="box" style="margin-top:8px"><p style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:4px">SIDIK DIGITAL (SHA-256)</p><p class="mono">'+esc(sig.hash)+'</p></div></div>'+
      '<div class="note">'+(sig.status==='AKTIF'&&utuh?
        'Identitas, waktu, dan dokumen di atas tercatat pada sistem KENDALI dan sidik digitalnya cocok. Tanda tangan elektronik ini sah sebagai bukti konfirmasi perangkat daerah.':
        (sig.status==='DICABUT'?'Tanda tangan ini telah dicabut oleh Bagian Organisasi. Dokumen yang memuatnya tidak lagi berlaku sebagai bukti konfirmasi.':
        (utuh?'Tanda tangan tercatat, namun dokumen Berita Acara belum ditetapkan secara final pada sistem.':'Sidik digital tidak cocok. Data pada basis sistem berbeda dengan saat penandatanganan. Hubungi Bagian Organisasi.')))+'</div>'+
      '<div style="text-align:center"><a class="btn" href="'+esc(getWebAppUrl())+'">Buka Aplikasi KENDALI</a></div></div>';
  }
  return '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Verifikasi Tanda Tangan Elektronik</title><style>'+css+'</style></head><body><div class="wrap"><div class="card">'+
    '<div class="hd"><h1>VERIFIKASI TANDA TANGAN ELEKTRONIK</h1><p>Sistem KENDALI — Bagian Organisasi Sekretariat Daerah Kabupaten Banyuwangi</p></div>'+
    body+'<div class="ft">© 2026 Pemerintah Kabupaten Banyuwangi · Halaman ini dihasilkan otomatis oleh sistem.</div></div></div></body></html>';
}

//============================================
// AUTH
//============================================
function login(nip,password){
  try{
    var sh=findUserSheet(); if(!sh) return {success:false,message:'Sheet user belum ada. Jalankan setupDatabase().'};
    var m=getUserSheetMap(sh);
    if(m.password<0) return {success:false,message:'Kolom Password tidak terdeteksi pada sheet '+m.sheetName+'.'};
    var d=sh.getRange(2,1,sh.getLastRow()-1,m.lastCol).getValues(), id=String(nip||'').trim(), pw=String(password||'');
    for(var i=0;i<d.length;i++) if(String(d[i][m.nip]==null?'':d[i][m.nip]).trim()===id&&String(d[i][m.password])===pw){
      var role=normalizeRole(d[i][m.role]), skpd=getSkpdForActor(id), pa=getPeriodeAktif();
      return {success:true,user:{nip:id,role:role,roleLabel:roleLabel(role),nama:String(d[i][m.nama]==null?'':d[i][m.nama]).trim()||id,
        opd:m.opd>=0?(String(d[i][m.opd]==null?'':d[i][m.opd]).trim()||'-'):'-',skpdList:skpd,
        canAgenda:role!=='UserOPD',canBankData:role!=='UserOPD',periodeAktif:pa}};
    }
    return {success:false,message:'NIP atau Password salah.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function changePassword(nip,oldPass,newPass){
  try{
    var u=findUserRow(nip); if(!u) return {success:false,message:'User tidak ditemukan.'};
    if(u.map.password<0) return {success:false,message:'Kolom Password tidak terdeteksi.'};
    if(!newPass||String(newPass).length<6) return {success:false,message:'Password baru minimal 6 karakter.'};
    if(String(u.raw[u.map.password])!==String(oldPass)) return {success:false,message:'Password lama salah.'};
    u.sheet.getRange(u.row,u.map.password+1).setValue(newPass);
    if(u.map.lastChange>=0) u.sheet.getRange(u.row,u.map.lastChange+1).setValue(new Date());
    var ls=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log_Password');
    if(ls) ls.appendRow([new Date(),nip,u.nama,'Change Password','Web App']);
    writeLog(nip,'Akun','Ganti Password',nip,'Password diperbarui sendiri');
    return {success:true,message:'Password berhasil diubah.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getPasswordLogs(actorNip){
  try{ assertRole(actorNip,['Superadmin']);
    var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log_Password'); if(!s||s.getLastRow()<2) return [];
    var d=s.getDataRange().getValues(); d.shift();
    return d.reverse().slice(0,150).map(function(r){ return {timestamp:r[0]?fmtDT(r[0]):'-',nip:String(r[1]||''),nama:String(r[2]||''),action:String(r[3]||'')}; });
  }catch(e){ return []; }
}

//============================================
// MANAJEMEN USER
//============================================
function getAllUsers(actorNip){
  try{
    if(actorNip) assertRole(actorNip,['Superadmin']);
    var sh=findUserSheet(); if(!sh||sh.getLastRow()<2) return [];
    var m=getUserSheetMap(sh), d=sh.getRange(2,1,sh.getLastRow()-1,m.lastCol).getValues(), out=[];
    for(var i=0;i<d.length;i++){
      var nip=String(d[i][m.nip]==null?'':d[i][m.nip]).trim(); if(!nip) continue;
      var raw=String(d[i][m.role]==null?'':d[i][m.role]), role=normalizeRole(raw);
      out.push({nip:nip,role:role,roleRaw:raw,roleLabel:roleLabel(role),roleMismatch:raw!==role,
        nama:String(d[i][m.nama]==null?'':d[i][m.nama]).trim()||nip,opd:m.opd>=0?(String(d[i][m.opd]==null?'':d[i][m.opd]).trim()||'-'):'-',
        rowIndex:i+2,lastChange:(m.lastChange>=0&&d[i][m.lastChange])?fmtDT(d[i][m.lastChange]):'-'}); }
    out.sort(function(a,b){ var x=roleOrder(a.role),y=roleOrder(b.role); return x!==y?x-y:String(a.nama).localeCompare(String(b.nama)); });
    return out;
  }catch(e){ Logger.log('getAllUsers: '+e); return []; }
}
function getUsersStats(actorNip){
  var u=getAllUsers(actorNip), s={total:u.length,superadmin:0,internal:0,opd:0,mismatch:0};
  for(var i=0;i<u.length;i++){ if(u[i].role==='Superadmin')s.superadmin++; else if(u[i].role==='TeamInternal')s.internal++; else s.opd++; if(u[i].roleMismatch)s.mismatch++; }
  return s;
}
function addUser(obj,actorNip){
  try{ assertRole(actorNip,['Superadmin']);
    var sh=findUserSheet(); if(!sh) return {success:false,message:'Sheet user belum ada.'};
    var m=getUserSheetMap(sh), nip=String(obj&&obj.nip||'').trim(), nama=String(obj&&obj.nama||'').trim();
    if(!nip||!nama) return {success:false,message:'NIP/ID dan Nama wajib diisi.'};
    var d=sh.getRange(2,1,Math.max(sh.getLastRow()-1,1),m.lastCol).getValues();
    for(var i=0;i<d.length;i++) if(String(d[i][m.nip]).trim()===nip) return {success:false,message:'NIP/ID sudah terdaftar!'};
    var role=normalizeRole(obj.role);
    sh.getRange(sh.getLastRow()+1,1,1,m.lastCol).setValues([buildUserRow(m,{nip:nip,password:String(obj.password||'password123'),role:role,nama:nama,opd:String(obj.opd||'-')})]);
    writeLog(actorNip,'Manajemen User','Tambah',nip,nama+' • '+roleLabel(role));
    return {success:true,message:'User '+nama+' ('+roleLabel(role)+') ditambahkan.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function updateUser(nip,obj,actorNip){
  try{ assertRole(actorNip,['Superadmin']);
    var u=findUserRow(nip); if(!u) return {success:false,message:'User tidak ditemukan.'};
    if(u.role==='Superadmin'&&obj.role&&normalizeRole(obj.role)!=='Superadmin'&&getUsersStats().superadmin<=1) return {success:false,message:'Minimal harus ada 1 Superadmin.'};
    if(obj.nama) u.sheet.getRange(u.row,u.map.nama+1).setValue(String(obj.nama).trim());
    if(obj.role) u.sheet.getRange(u.row,u.map.role+1).setValue(normalizeRole(obj.role));
    if(obj.opd!==undefined&&u.map.opd>=0) u.sheet.getRange(u.row,u.map.opd+1).setValue(String(obj.opd||'-'));
    writeLog(actorNip,'Manajemen User','Edit',nip,'Perubahan data user');
    return {success:true,message:'User berhasil diperbarui.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function deleteUser(nip,actorNip){
  try{ assertRole(actorNip,['Superadmin']);
    if(String(nip).trim()===String(actorNip).trim()) return {success:false,message:'Tidak bisa menghapus akun sendiri!'};
    var u=findUserRow(nip); if(!u) return {success:false,message:'User tidak ditemukan.'};
    if(u.role==='Superadmin') return {success:false,message:'Akun Superadmin tidak boleh dihapus!'};
    u.sheet.deleteRow(u.row); writeLog(actorNip,'Manajemen User','Hapus',nip,u.nama);
    return {success:true,message:'User berhasil dihapus.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function resetUserPassword(nip,actorNip){
  try{ assertRole(actorNip,['Superadmin']);
    var u=findUserRow(nip); if(!u) return {success:false,message:'User tidak ditemukan.'};
    if(u.map.password<0) return {success:false,message:'Kolom Password tidak terdeteksi.'};
    u.sheet.getRange(u.row,u.map.password+1).setValue('password123');
    if(u.map.lastChange>=0) u.sheet.getRange(u.row,u.map.lastChange+1).setValue(new Date());
    var ls=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log_Password');
    if(ls) ls.appendRow([new Date(),nip,u.nama,'Reset by Admin','Web App']);
    writeLog(actorNip,'Manajemen User','Reset Password',nip,u.nama);
    return {success:true,message:'Password '+u.nama+' direset ke password123.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getOpdList(){ return OPD_LIST(); }
function syncUserOPD(actorNip){
  try{ assertRole(actorNip,['Superadmin']);
    var a=setupUserOPD(); setupProfilOPD(); setupTPPSheets(); setupTTDSheet(); var s=getUsersStats();
    writeLog(actorNip,'Manajemen User','Sinkron OPD','',a+' akun baru');
    return {success:true,message:(a>0?a+' akun OPD baru dibuat. ':'Sudah sinkron. ')+'Total '+s.total+' akun ('+s.superadmin+' Superadmin, '+s.internal+' Internal, '+s.opd+' OPD).'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function diagnoseUsers(actorNip){
  try{ assertRole(actorNip,['Superadmin']);
    var sh=findUserSheet(); if(!sh) return {success:false,message:'Sheet user tidak ditemukan.'};
    var m=getUserSheetMap(sh), res={success:true,sheetName:m.sheetName,totalRows:Math.max(sh.getLastRow()-1,0),headers:m.headers,mapSource:m.source,columns:{},rawRoleCounts:{},samples:[],stats:getUsersStats()};
    var f=['nip','password','role','nama','opd'];
    for(var k=0;k<f.length;k++){ var idx=m[f[k]]; res.columns[f[k]]={index:idx,letter:colLetter(idx),header:idx>=0?(m.headers[idx]||'(tanpa header)'):'-'}; }
    if(sh.getLastRow()>=2){ var d=sh.getRange(2,1,sh.getLastRow()-1,m.lastCol).getValues();
      for(var i=0;i<d.length;i++){ var raw=String(d[i][m.role]==null?'':d[i][m.role]); res.rawRoleCounts[raw]=(res.rawRoleCounts[raw]||0)+1;
        if(res.samples.length<12) res.samples.push({row:i+2,nip:String(d[i][m.nip]||''),nama:String(d[i][m.nama]||''),roleRaw:raw,roleNorm:normalizeRole(raw)}); } }
    return res;
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function repairUserSheet(actorNip){
  try{
    if(actorNip) assertRole(actorNip,['Superadmin']);
    var sh=findUserSheet(); if(!sh) return {success:false,message:'Sheet user tidak ditemukan.'};
    var m=getUserSheetMap(sh), last=sh.getLastRow(); if(last<2) return {success:false,message:'Sheet user kosong.'};
    var v=sh.getRange(2,1,last-1,m.lastCol).getValues(), up=[], ch=0;
    for(var i=0;i<v.length;i++){ var raw=String(v[i][m.role]==null?'':v[i][m.role]), n=normalizeRole(raw); up.push([n]); if(raw!==n) ch++; }
    sh.getRange(2,m.role+1,last-1,1).setValues(up);
    var s=getUsersStats();
    if(actorNip) writeLog(actorNip,'Manajemen User','Perbaiki Role','',ch+' role distandarkan');
    return {success:true,changed:ch,stats:s,message:(ch>0?ch+' role diperbaiki pada kolom '+colLetter(m.role)+'. ':'Semua role sudah standar. ')+'Sekarang: '+s.superadmin+' Superadmin, '+s.internal+' Team Internal, '+s.opd+' User OPD.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function normalizeAllRoles(actorNip){ return repairUserSheet(actorNip); }

//============================================
// BANK DATA
//============================================
function getBankDataFolder(){ var f=DriveApp.getFoldersByName('KENDALI_BankData'); return f.hasNext()?f.next():DriveApp.createFolder('KENDALI_BankData'); }
function setupBankDataSheet(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Data_BankData');
  if(!s){ s=ss.insertSheet('Data_BankData');
        s.appendRow(['ID','Judul','Jenis_Dokumen','Nomor_Dokumen','Tahun','Tanggal_Dokumen','Kategori','SKPD_Terkait','Tags','Deskripsi','Status','File_ID','File_Name','File_Type','File_Size','Uploaded_By_NIP','Uploaded_By_Nama','Tanggal_Upload','Download_Count','Last_Update']);
   s.getRange(1,1,1,20).setFontWeight('bold').setBackground('#fef9c3'); s.setFrozenRows(1);
}
return s;
}
function bdRowToObj(r){

  var id=String(r[11]||'');
  return {id:String(r[0]||''),judul:String(r[1]||''),jenis:String(r[2]||''),nomor:String(r[3]||''),tahun:String(r[4]||''),
    tanggal:formatTanggalValue(r[5]),kategori:String(r[6]||''),skpd:String(r[7]||''),tags:String(r[8]||''),deskripsi:String(r[9]||''),
    status:'Final',file_id:id,file_name:String(r[12]||''),file_type:String(r[13]||''),file_size:Number(r[14]||0),
    uploader_nip:String(r[15]||''),uploader:String(r[16]||''),tanggal_upload:r[17]?fmtDT(r[17]):'-',download_count:Number(r[18]||0),
    previewUrl:id?'https://drive.google.com/file/d/'+id+'/preview':'',viewUrl:id?'https://drive.google.com/file/d/'+id+'/view':'',
    downloadUrl:id?'https://drive.google.com/uc?export=download&id='+id:''};
}
function getBankData(actorNip,filter){
  try{
    assertRole(actorNip,['Superadmin','TeamInternal']);
    var s=setupBankDataSheet(); if(s.getLastRow()<2) return [];
    var d=s.getRange(2,1,s.getLastRow()-1,21).getValues(), out=[], f=filter||{}, q=String(f.q||'').toLowerCase();
    for(var i=0;i<d.length;i++){
      if(!String(d[i][0]||'')) continue;
      var o=bdRowToObj(d[i]); o.rowIndex=i+2;
      if(f.jenis&&o.jenis!==f.jenis) continue;
      if(f.kategori&&o.kategori!==f.kategori) continue;
      if(f.status&&o.status!==f.status) continue;
      if(f.tahun&&String(o.tahun)!==String(f.tahun)) continue;
      if(q&&(o.judul+' '+o.file_name+' '+o.nomor+' '+o.tags+' '+o.deskripsi+' '+o.skpd+' '+o.jenis+' '+o.kategori).toLowerCase().indexOf(q)===-1) continue;
      out.push(o); }
    var sort=f.sort||'newest';
    out.sort(function(a,b){
      if(sort==='oldest') return a.rowIndex-b.rowIndex;
      if(sort==='title') return a.judul.localeCompare(b.judul);
      if(sort==='popular') return b.download_count-a.download_count;
      if(sort==='year') return String(b.tahun).localeCompare(String(a.tahun))||b.rowIndex-a.rowIndex;
      return b.rowIndex-a.rowIndex; });
    return out;
  }catch(e){ Logger.log('getBankData: '+e); return []; }
}
function getBankDataStats(actorNip){
  var d=getBankData(actorNip,{}), s={total:0,size:0,byJenis:{},byTahun:{},byStatus:{},downloads:0};
  for(var i=0;i<d.length;i++){ s.total++; s.size+=d[i].file_size; s.downloads+=d[i].download_count;
    s.byJenis[d[i].jenis]=(s.byJenis[d[i].jenis]||0)+1; s.byTahun[d[i].tahun]=(s.byTahun[d[i].tahun]||0)+1; s.byStatus[d[i].status]=(s.byStatus[d[i].status]||0)+1; }
  return s;
}
function getBankDataMeta(){ var y=[],n=new Date().getFullYear(); for(var i=n+1;i>=2015;i--) y.push(String(i));
  return {jenis:JENIS_DOKUMEN,kategori:KATEGORI_DOKUMEN,status:STATUS_DOKUMEN,tahun:y,skpd:OPD_LIST()}; }
function saveBankData(obj,actorNip){
  try{
    var u=assertRole(actorNip,['Superadmin','TeamInternal']);
    if(!obj||!obj.judul) return {success:false,message:'Judul dokumen wajib diisi.'};
    if(!obj.file_id&&!obj.id) return {success:false,message:'File dokumen belum diunggah.'};
    var s=setupBankDataSheet(), id=obj.id||('BD-'+Utilities.getUuid().substring(0,8).toUpperCase()), rowIdx=-1, old=null;
    if(s.getLastRow()>1){ var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
      for(var i=0;i<d.length;i++) if(String(d[i][0])===String(id)){ rowIdx=i+2; old=d[i]; break; } }
    if(old&&u.role!=='Superadmin'&&String(old[16])!==u.nip) return {success:false,message:'Hanya pengunggah atau Superadmin yang dapat mengubah dokumen ini.'};
        var row=[id,String(obj.judul).trim(),String(obj.jenis||'Lainnya'),String(obj.nomor||''),String(obj.tahun||new Date().getFullYear()),
      obj.tanggal||'',String(obj.kategori||'Umum'),String(obj.skpd||'-'),String(obj.tags||''),String(obj.deskripsi||''),
      'Final',obj.file_id||(old?String(old[12]):''),
      obj.file_name||(old?String(old[13]):''),obj.file_type||(old?String(old[14]):''),Number(obj.file_size||(old?old[15]:0)),
      old?String(old[16]):u.nip,old?String(old[17]):u.nama,old?old[18]:new Date(),old?Number(old[19]||0):0,new Date()];
    writeLog(actorNip,'Bank Data',rowIdx>0?'Edit':'Tambah',id,row[1]+' • '+row[2]);
    return {success:true,id:id,message:'Dokumen "'+row[1]+'" berhasil '+(rowIdx>0?'diperbarui':'disimpan')+'.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function deleteBankData(id,actorNip){
  try{
    var u=assertRole(actorNip,['Superadmin','TeamInternal']);
    var s=setupBankDataSheet(); if(s.getLastRow()<2) return {success:false,message:'Data kosong.'};
    var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
    for(var i=0;i<d.length;i++) if(String(d[i][0])===String(id)){
      if(u.role!=='Superadmin'&&String(d[i][16])!==u.nip) return {success:false,message:'Hanya pengunggah atau Superadmin yang dapat menghapus.'};
      try{ if(d[i][12]) DriveApp.getFileById(String(d[i][12])).setTrashed(true); }catch(e){}
      s.deleteRow(i+2); writeLog(actorNip,'Bank Data','Hapus',id,String(d[i][1]));
      return {success:true,message:'Dokumen berhasil dihapus beserta file-nya.'}; }
    return {success:false,message:'Dokumen tidak ditemukan.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function uploadBankDataFile(base64,filename,mimeType,actorNip){
  try{ assertRole(actorNip,['Superadmin','TeamInternal']);
    var file=getBankDataFolder().createFile(Utilities.newBlob(Utilities.base64Decode(base64),mimeType,filename));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    var id=file.getId();
    return {success:true,file_id:id,file_name:filename,file_type:mimeType,file_size:file.getSize(),
      previewUrl:'https://drive.google.com/file/d/'+id+'/preview',viewUrl:'https://drive.google.com/file/d/'+id+'/view',downloadUrl:'https://drive.google.com/uc?export=download&id='+id};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function countBankDownload(id,actorNip){
  try{ assertRole(actorNip,['Superadmin','TeamInternal']);
    var s=setupBankDataSheet(); if(s.getLastRow()<2) return {success:true};
    var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
    for(var i=0;i<d.length;i++) if(String(d[i][0])===String(id)){ s.getRange(i+2,20).setValue(Number(d[i][19]||0)+1); writeLog(actorNip,'Bank Data','Download',id,String(d[i][1])); return {success:true}; }
    return {success:true};
  }catch(e){ return {success:false}; }
}

//============================================
// TPP
//============================================
function getTPPFolder(){ var f=DriveApp.getFoldersByName('KENDALI_BeritaAcara_TPP'); return f.hasNext()?f.next():DriveApp.createFolder('KENDALI_BeritaAcara_TPP'); }
function setupTPPSheets(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), t=ss.getSheetByName('Data_TPP');
  if(!t){ t=ss.insertSheet('Data_TPP');
    t.getRange(1,1,1,27).setValues([TPP_HEAD]).setFontWeight('bold').setBackground('#dbeafe'); t.setFrozenRows(1); }
  else if(t.getLastColumn()<27){
    var lc=Math.max(t.getLastColumn(),1), lr=t.getLastRow();
    var hdr=t.getRange(1,1,1,lc).getValues()[0].map(function(x){return String(x==null?'':x);});
    var old=lr>1?t.getRange(2,1,lr-1,lc).getValues():[];
    var idx={}; for(var h=0;h<hdr.length;h++) idx[hdr[h]]=h;
    t.clear();
    t.getRange(1,1,1,27).setValues([TPP_HEAD]).setFontWeight('bold').setBackground('#dbeafe'); t.setFrozenRows(1);
    if(old.length){ var mig=[];
      for(var i=0;i<old.length;i++){ var row=[];
        for(var c=0;c<27;c++){ var nm=TPP_HEAD[c], j=idx[nm]; row.push(j===undefined?'':old[i][j]); }
        mig.push(row); }
      t.getRange(2,1,mig.length,27).setValues(mig); }
  }
  var cf=ss.getSheetByName('Config_TPP');
  if(!cf){ cf=ss.insertSheet('Config_TPP'); cf.appendRow(['Parameter','Nilai','Keterangan']); cf.getRange(1,1,1,3).setFontWeight('bold').setBackground('#e0e7ff'); }
  var def=[
    ['OBJEK_TPP',OBJEK_DEFAULT,'Objek persetujuan pada isi Berita Acara.'],
    ['LABEL_ADMIN','Pengelola Admin TPP','Sebutan jabatan penanda tangan admin OPD.'],
    ['JUDUL_ADMIN','Yang Menyatakan Setuju,','Judul di atas tanda tangan Pengelola Admin.'],
    ['JUDUL_KEPALA','Mengetahui,','Judul di atas tanda tangan Kepala OPD.'],
    ['POSISI_TTD','KEPALA_KIRI','KEPALA_KIRI = Kepala OPD di kiri. ADMIN_KIRI = sebaliknya.'],
    ['METODE_TTD_DEFAULT','ELEKTRONIK','Metode bawaan: ELEKTRONIK (QR verifikasi) atau MANUAL.'],
    ['QR_LABEL','Tanda Tangan Elektronik','Keterangan di bawah barcode QR.'],
    ['TAMPILKAN_URL_VERIFIKASI','YA','YA = cetak tautan verifikasi di bawah blok tanda tangan.'],
    ['WAJIB_TTD_ELEKTRONIK','TIDAK','YA = kedua penanda tangan wajib elektronik (QR).'],
    ['KUNCI_PERIODE','YA','YA = hanya periode bulan sebelum bulan berjalan yang dapat disetujui.'],
    ['BATAS_TANGGAL_KONFIRMASI','KETAT','KETAT = tanggal 7 & 10 dibuka pada bulan berikutnya.'],
    ['KUNCI_SETERAH_BA','YA','YA = konfirmasi tidak dapat diubah setelah draft BA dibuat.'],
    ['IZINKAN_CETAK_ULANG_BA','YA','YA = draft dapat dibuat ulang selama BA bertanda tangan belum diunggah.'],
    ['WAJIB_BA_FINAL','TIDAK','YA = admin OPD wajib mengunggah BA bertanda tangan & berstempel.']
  ];
  var have={}, last=cf.getLastRow(), rowsCf=last>1?cf.getRange(2,1,last-1,3).getValues():[];
  for(var k=0;k<rowsCf.length;k++) have[String(rowsCf[k][0])]=k;
  var add=[]; for(var d2=0;d2<def.length;d2++) if(have[def[d2][0]]===undefined) add.push(def[d2]);
  if(add.length) cf.getRange(last+1,1,add.length,3).setValues(add);
  if(have['OBJEK_TPP']!==undefined){
    var cur=String(rowsCf[have['OBJEK_TPP']][1]||'');
    if(!cur||cur==='data dan dokumen pendukung Tambahan Penghasilan Pegawai (TPP)') cf.getRange(have['OBJEK_TPP']+2,2).setValue(OBJEK_DEFAULT);
  }
  var ct=ss.getSheetByName('Counter_Dokumen');
  if(!ct){ ct=ss.insertSheet('Counter_Dokumen'); ct.appendRow(['Jenis','Tahun','Nomor_Terakhir']); ct.getRange(1,1,1,3).setFontWeight('bold').setBackground('#fde68a'); }
  return t;
}
function getTPPConfig(){ setupTPPSheets(); return getTPPConfigRaw_(); }
function saveTPPConfig(obj,actorNip){
  try{ assertRole(actorNip,['Superadmin']); setupTPPSheets();
    var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config_TPP'), d=s.getRange(2,1,s.getLastRow()-1,3).getValues();
    for(var k in obj){ var found=false;
      for(var i=0;i<d.length;i++) if(String(d[i][0])===k){ s.getRange(i+2,2).setValue(String(obj[k])); found=true; break; }
      if(!found) s.appendRow([k,String(obj[k]),'']); }
    writeLog(actorNip,'TPP','Ubah Konfigurasi','','Parameter konfigurasi diperbarui');
    return {success:true,message:'Konfigurasi TPP berhasil disimpan.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getPeriodeAktif(){
  var n=new Date(), y=n.getFullYear(), m=n.getMonth()+1, pm=m-1, py=y;
  if(pm===0){ pm=12; py=y-1; }
  return {tahun:py,bulan:pm,label:BULAN_ID[pm-1]+' '+py,romawi:ROMAWI[pm-1],konfirmasiTahun:y,konfirmasiBulan:m,konfirmasiLabel:BULAN_ID[m-1]+' '+y};
}
function periodeLE(y,m,ay,am){ return (Number(y)<ay)||(Number(y)===ay&&Number(m)<=am); }
function windowOpen(y,m,which,cfg,now){
  if(String(cfg.BATAS_TANGGAL_KONFIRMASI||'KETAT').toUpperCase()!=='KETAT') return {open:true,label:''};
  var ny=Number(y), nm=Number(m)+1; if(nm>12){ nm=1; ny++; }
  var day=(String(which)==='7')?7:10, open=new Date(ny,nm-1,day,0,0,0);
  return {open:now.getTime()>=open.getTime(),label:day+' '+BULAN_ID[nm-1]+' '+ny};
}
function nextDocNumber(jenis,tahun,peek){
  setupTPPSheets();
  var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Counter_Dokumen'), last=s.getLastRow();
  var d=last>1?s.getRange(2,1,last-1,3).getValues():[];
  for(var i=0;i<d.length;i++) if(String(d[i][0])===jenis&&String(d[i][1])===String(tahun)){
    var cur=Number(d[i][2]||0); if(peek) return cur+1; s.getRange(i+2,3).setValue(cur+1); return cur+1; }
  if(peek) return 1; s.appendRow([jenis,String(tahun),1]); return 1;
}
function setDocNumberAtLeast(jenis,tahun,num){
  var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Counter_Dokumen'), last=s.getLastRow();
  var d=last>1?s.getRange(2,1,last-1,3).getValues():[];
  for(var i=0;i<d.length;i++) if(String(d[i][0])===jenis&&String(d[i][1])===String(tahun)){ if(Number(d[i][2]||0)<num) s.getRange(i+2,3).setValue(num); return; }
  s.appendRow([jenis,String(tahun),num]);
}
function tppKey(skpd,tahun,bulan){ return canon(skpd)+'|'+tahun+'|'+bulan; }
function tppStatus(a,b){ return (a&&b)?'Lengkap':((a||b)?'Sebagian':'Belum'); }
function readTPP(year,cfg){
  var s=setupTPPSheets(), map={}, lock=String(cfg.KUNCI_SETERAH_BA||'YA').toUpperCase()==='YA', sigMap=readSignaturesMap();
  if(s.getLastRow()<2) return map;
  var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
  for(var i=0;i<d.length;i++){
    if(String(d[i][3])!==String(year)) continue;
    var ba=String(d[i][15]||''), fin=String(d[i][21]||''), p7=dtParts(d[i][6]), p10=dtParts(d[i][10]);
    var id=String(d[i][0]), sg=sigMap[id]||[], sa=null, sk2=null;
    for(var q=0;q<sg.length;q++){ if(sg[q].status==='DICABUT') continue;
      if(sg[q].peran==='ADMIN') sa=sg[q]; else if(sg[q].peran==='KEPALA') sk2=sg[q]; }
    map[tppKey(d[i][1],d[i][3],d[i][4])]={id:id,skpd:String(d[i][1]),kode:String(d[i][2]),tahun:String(d[i][3]),bulan:Number(d[i][4]),
      tgl7:String(d[i][5])==='YA',tgl7_waktu:fmtDT(d[i][6]),tgl7_tgl:p7.tgl,tgl7_jam:p7.jam,tgl7_oleh:String(d[i][8]||''),tgl7_nip:String(d[i][7]||''),
      tgl10:String(d[i][9])==='YA',tgl10_waktu:fmtDT(d[i][10]),tgl10_tgl:p10.tgl,tgl10_jam:p10.jam,tgl10_oleh:String(d[i][12]||''),tgl10_nip:String(d[i][11]||''),
      status:String(d[i][13]||'Belum'),ba_nomor:String(d[i][14]||''),ba_file_id:ba,ba_waktu:fmtDT(d[i][16]),ba_oleh:String(d[i][17]||''),
      pic_nip:String(d[i][18]||''),pic_nama:String(d[i][19]||''),
      final_file_id:fin,final_name:String(d[i][22]||''),final_type:String(d[i][23]||''),final_size:Number(d[i][24]||0),
      final_upload:fmtDT(d[i][25]),final_by:String(d[i][26]||''),
      sig_admin:sa,sig_kepala:sk2,signatures:sg,
      locked:!!(ba&&lock),rowIndex:i+2}; }
  return map;
}
function emptyTPPRec(skpd,yr,b,info){
  return {id:'',skpd:skpd,kode:info.kode,tahun:String(yr),bulan:b,tgl7:false,tgl7_waktu:'',tgl7_tgl:'',tgl7_jam:'',tgl7_oleh:'',
    tgl10:false,tgl10_waktu:'',tgl10_tgl:'',tgl10_jam:'',tgl10_oleh:'',status:'Belum',ba_nomor:'',ba_file_id:'',ba_waktu:'',ba_oleh:'',
    pic_nip:info.pic_nip,pic_nama:info.pic_nama,final_file_id:'',final_name:'',final_type:'',final_size:0,final_upload:'',final_by:'',
    sig_admin:null,sig_kepala:null,signatures:[],locked:false};
}
function getTPPMatrix(year,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.',rows:[]};
    var yr=Number(year)||new Date().getFullYear(), cfg=getTPPConfig(), pa=getPeriodeAktif(), now=new Date();
    var mine=getSkpdForActor(actorNip), map=readTPP(yr,cfg), rows=[], prof={};
    var ps=setupProfilOPD();
    if(ps.getLastRow()>1){ var pd=ps.getRange(2,1,ps.getLastRow()-1,21).getValues(); for(var p=0;p<pd.length;p++) prof[canon(pd[p][0])]=profilObj(pd[p],false); }
    for(var i=0;i<mine.length;i++){
      var sk=mine[i], info=getPICForSkpd(sk), months=[];
      for(var b=1;b<=12;b++){
        var rec=map[tppKey(sk,yr,b)]||emptyTPPRec(sk,yr,b,info);
        rec.eligible=periodeLE(yr,b,pa.tahun,pa.bulan)||String(cfg.KUNCI_PERIODE||'YA').toUpperCase()!=='YA';
        rec.isAktif=(yr===pa.tahun&&b===pa.bulan);
        rec.win7=windowOpen(yr,b,'7',cfg,now); rec.win10=windowOpen(yr,b,'10',cfg,now);
        months.push(rec); }
      var lg=0,sb=0,ba2=0,fn2=0;
      for(var j=0;j<months.length;j++){ if(months[j].status==='Lengkap')lg++; else if(months[j].status==='Sebagian')sb++; if(months[j].ba_file_id)ba2++; if(months[j].final_file_id)fn2++; }
      rows.push({skpd:sk,kode:info.kode,jenis:info.jenis,pic_nip:info.pic_nip,pic_nama:info.pic_nama,months:months,
        lengkap:lg,sebagian:sb,belum:12-lg-sb,ba_count:ba2,final_count:fn2,progress:Math.round(lg/12*100),
        profil:prof[canon(sk)]||{skpd:sk,admin:{jabatan:defaultJabatanAdmin(sk),nama:'',nip:'',pangkat:'',ttd_file_id:'',metode:normMetode(cfg.METODE_TTD_DEFAULT)},kepala:{jabatan:defaultJabatanKepala(sk),nama:'',nip:'',pangkat:'',ttd_file_id:'',metode:normMetode(cfg.METODE_TTD_DEFAULT),has_pin:false},lengkap:false}}); }
    rows.sort(function(a,b){ return a.skpd.localeCompare(b.skpd); });
    var pics={}, plist=[];
    for(var x=0;x<rows.length;x++){ var kk=rows[x].pic_nip||'-';
      if(!pics[kk]){ pics[kk]=true; plist.push({nip:kk,nama:rows[x].pic_nama||'Tanpa PIC'}); } }
    plist.sort(function(a,b){ return a.nama.localeCompare(b.nama); });
    return {success:true,year:yr,role:u.role,nama:u.nama,rows:rows,config:cfg,periodeAktif:pa,picList:plist,bulanNama:BULAN_ID,bulanShort:BULAN_SHORT};
  }catch(e){ return {success:false,message:'Error: '+e.message,rows:[]}; }
}
function getTPPStats(year,actorNip){
  var r=getTPPMatrix(year,actorNip), s={skpd:0,lengkap:0,sebagian:0,belum:0,ba:0,final:0,slotTotal:0,slotIsi:0,picCount:0,terkunci:0};
  if(!r.success) return s;
  var pics={};
  for(var i=0;i<r.rows.length;i++){ var row=r.rows[i]; s.skpd++; s.lengkap+=row.lengkap; s.sebagian+=row.sebagian; s.belum+=row.belum; s.ba+=row.ba_count; s.final+=row.final_count; s.slotTotal+=24;
    for(var j=0;j<row.months.length;j++){ if(row.months[j].tgl7)s.slotIsi++; if(row.months[j].tgl10)s.slotIsi++; if(row.months[j].locked)s.terkunci++; }
    if(row.pic_nip) pics[row.pic_nip]=true; }
  s.picCount=Object.keys(pics).length; s.persenSlot=s.slotTotal?Math.round(s.slotIsi/s.slotTotal*100):0;
  return s;
}
function saveTPPConfirmation(skpd,year,month,which,checked,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid. Silakan login ulang.'};
    if(u.role==='TeamInternal') return {success:false,message:'Team Internal berperan sebagai pengawas. Pengisian konfirmasi dilakukan oleh admin OPD.'};
    if(!ownsSkpd(actorNip,skpd)) return {success:false,message:'Anda tidak berwenang mengisi SKPD ini.'};
    var yr=Number(year), bl=Number(month);
    if(bl<1||bl>12) return {success:false,message:'Bulan tidak valid.'};
    if(which!=='7'&&which!=='10') return {success:false,message:'Kolom konfirmasi tidak valid.'};
    var cfg=getTPPConfig(), pa=getPeriodeAktif(), now=new Date();
    var s=setupTPPSheets(), info=getPICForSkpd(skpd), rowIdx=-1, cur=null;
    if(s.getLastRow()>1){ var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
      for(var j=0;j<d.length;j++) if(canon(d[j][1])===canon(skpd)&&String(d[j][3])===String(yr)&&Number(d[j][4])===bl){ rowIdx=j+2; cur=d[j]; break; } }
    var baLama=cur?String(cur[15]||''):'';
    if(baLama&&String(cfg.KUNCI_SETERAH_BA||'YA').toUpperCase()==='YA')
      return {success:false,locked:true,message:'Periode '+BULAN_ID[bl-1]+' '+yr+' telah DIKUNCI karena Berita Acara '+(cur?String(cur[14]):'')+' sudah dibuat. Perubahan hanya dapat dilakukan oleh Bagian Organisasi.'};
    if(u.role!=='Superadmin'){
      if(String(cfg.KUNCI_PERIODE||'YA').toUpperCase()==='YA'&&!periodeLE(yr,bl,pa.tahun,pa.bulan))
        return {success:false,message:'Periode '+BULAN_ID[bl-1]+' '+yr+' belum dapat disetujui. Periode yang sedang disetujui adalah '+pa.label+'.'};
      if(checked){ var w=windowOpen(yr,bl,which,cfg,now);
        if(!w.open) return {success:false,message:'Konfirmasi tanggal '+which+' periode '+BULAN_ID[bl-1]+' '+yr+' dapat dilakukan mulai '+w.label+'.'}; } }
    var id=cur?String(cur[0]):('TPP-'+info.kode+'-'+yr+'-'+(bl<10?'0'+bl:bl));
    var a=cur?String(cur[5])==='YA':false, b=cur?String(cur[9])==='YA':false;
    var aw=cur?cur[6]:'', an=cur?String(cur[8]||''):'', anip=cur?String(cur[7]||''):'';
    var bw=cur?cur[10]:'', bn=cur?String(cur[12]||''):'', bnip=cur?String(cur[11]||''):'';
    if(which==='7'){ a=!!checked; aw=checked?now:''; an=checked?u.nama:''; anip=checked?u.nip:''; }
    else { b=!!checked; bw=checked?now:''; bn=checked?u.nama:''; bnip=checked?u.nip:''; }
    var row=[id,skpd,info.kode,String(yr),bl,a?'YA':'',aw,anip,an,b?'YA':'',bw,bnip,bn,tppStatus(a,b),
      cur?String(cur[14]||''):'',baLama,cur?cur[16]:'',cur?String(cur[17]||''):'',info.pic_nip,info.pic_nama,now,
      cur?String(cur[21]||''):'',cur?String(cur[22]||''):'',cur?String(cur[23]||''):'',cur?Number(cur[24]||0):0,cur?cur[25]:'',cur?String(cur[26]||''):''];
    if(rowIdx>0) s.getRange(rowIdx,1,1,27).setValues([row]); else s.appendRow(row);
    writeLog(actorNip,'TPP',checked?'Centang':'Batal Centang',id,skpd+' • '+BULAN_ID[bl-1]+' '+yr+' • tanggal '+which);
    return {success:true,status:tppStatus(a,b),message:'Konfirmasi tanggal '+which+' periode '+BULAN_ID[bl-1]+' '+yr+' '+(checked?'disimpan':'dibatalkan')+'. Status: '+tppStatus(a,b)+'.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getTPPDetail(skpd,year,month,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(!ownsSkpd(actorNip,skpd)) return {success:false,message:'SKPD ini di luar wilayah Anda.'};
    var cfg=getTPPConfig(), pa=getPeriodeAktif(), now=new Date(), map=readTPP(Number(year),cfg);
    var info=getPICForSkpd(skpd), rec=map[tppKey(skpd,year,month)]||emptyTPPRec(skpd,Number(year),Number(month),info);
    rec.eligible=periodeLE(Number(year),Number(month),pa.tahun,pa.bulan)||String(cfg.KUNCI_PERIODE||'YA').toUpperCase()!=='YA';
    rec.win7=windowOpen(year,month,'7',cfg,now); rec.win10=windowOpen(year,month,'10',cfg,now);
    var pr=readProfilRow(skpd);
    return {success:true,record:rec,config:cfg,periodeAktif:pa,profil:pr?profilObj(pr.data,false):null,kontak:getKontak(skpd),
      bulanNama:BULAN_ID[Number(month)-1],romawi:ROMAWI[Number(month)-1],isSuper:u.role==='Superadmin',
      canUpload:u.role!=='TeamInternal',appUrl:getWebAppUrl()};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function prepareBeritaAcara(skpd,year,month,opts,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(u.role==='TeamInternal') return {success:false,message:'Pembuatan Berita Acara dilakukan oleh admin OPD yang bersangkutan.'};
    if(!ownsSkpd(actorNip,skpd)) return {success:false,message:'Anda tidak berwenang membuat Berita Acara untuk SKPD ini.'};
    var cfg=getTPPConfig(), map=readTPP(Number(year),cfg), rec=map[tppKey(skpd,year,month)];
    if(!rec||rec.status!=='Lengkap') return {success:false,message:'Berita Acara hanya dapat dibuat jika konfirmasi tanggal 7 dan 10 sudah lengkap.'};
    if(rec.final_file_id) return {success:false,message:'Berita Acara bertanda tangan sudah diunggah untuk periode ini. Hapus unggahan tersebut terlebih dahulu atau hubungi Bagian Organisasi.'};
    if(rec.ba_file_id&&String(cfg.IZINKAN_CETAK_ULANG_BA||'YA').toUpperCase()!=='YA')
      return {success:false,message:'Berita Acara periode ini sudah dibuat dan pencetakan ulang dinonaktifkan.'};
    var pr=readProfilRow(skpd); if(!pr) return {success:false,message:'Profil OPD belum tersedia.'};
    var p=profilObj(pr.data,true);
    if(!p.admin.nama||!p.admin.nip||!p.admin.pangkat) return {success:false,needProfil:true,message:'Lengkapi dahulu Nama, NIP, dan Pangkat/Golongan Pengelola Admin pada menu Profil OPD & TTD.'};
    if(!p.kepala.nama||!p.kepala.nip||!p.kepala.pangkat) return {success:false,needProfil:true,message:'Lengkapi dahulu Nama, NIP, dan Pangkat/Golongan Kepala OPD pada menu Profil OPD & TTD.'};
    var o=opts||{};
    var mA=normMetode(o.adminMetode||p.admin.metode||cfg.METODE_TTD_DEFAULT);
    var mK=normMetode(o.kepalaMetode||p.kepala.metode||cfg.METODE_TTD_DEFAULT);
    if(String(cfg.WAJIB_TTD_ELEKTRONIK||'TIDAK').toUpperCase()==='YA'){ mA='ELEKTRONIK'; mK='ELEKTRONIK'; }
    if(mK==='ELEKTRONIK'&&String(pr.data[18]||'')){
      if(!String(o.kepalaPin||'')) return {success:false,needPin:true,message:'PIN persetujuan Kepala OPD diperlukan untuk tanda tangan elektronik.'};
      if(pinHash(skpd,String(o.kepalaPin))!==String(pr.data[18])) return {success:false,needPin:true,message:'PIN persetujuan Kepala OPD salah.'};
    }
    var info=getPICForSkpd(skpd);
    var nomor=rec.ba_nomor||(('000'+nextDocNumber('BA-TPP',year,true)).slice(-3)+'/BA-TPP/'+info.kode+'/'+ROMAWI[Number(month)-1]+'/'+year);
    var periode=BULAN_ID[Number(month)-1]+' '+year;
    p.admin.jabatan=p.admin.jabatan||defaultJabatanAdmin(skpd);
    p.kepala.jabatan=p.kepala.jabatan||defaultJabatanKepala(skpd);
    p.admin.metode=mA; p.kepala.metode=mK;
    var sigA=null,sigK=null,tokens=[];
    if(mA==='ELEKTRONIK'){ sigA=createSignature(rec,nomor,periode,'ADMIN',p.admin,u); tokens.push(sigA.token); }
    if(mK==='ELEKTRONIK'){ sigK=createSignature(rec,nomor,periode,'KEPALA',p.kepala,u); tokens.push(sigK.token); }
    return {success:true,nomor:nomor,record:rec,profil:p,kontak:getKontak(skpd),config:cfg,logo:getLogoKop(),
      sigAdmin:sigA,sigKepala:sigK,tokens:tokens,
      bulanNama:BULAN_ID[Number(month)-1],romawi:ROMAWI[Number(month)-1],pic_nama:info.pic_nama,reprint:!!rec.ba_file_id,appUrl:getWebAppUrl()};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function registerBeritaAcara(skpd,year,month,base64,filename,nomor,tokens,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(!ownsSkpd(actorNip,skpd)) return {success:false,message:'Tidak berwenang.'};
    var cfg=getTPPConfig(), s=setupTPPSheets(), map=readTPP(Number(year),cfg), rec=map[tppKey(skpd,year,month)];
    if(!rec||rec.status!=='Lengkap') return {success:false,message:'Konfirmasi belum lengkap.'};
    if(rec.final_file_id) return {success:false,message:'BA bertanda tangan sudah diunggah. Draft tidak dapat dibuat ulang.'};
    if(rec.ba_file_id&&String(cfg.IZINKAN_CETAK_ULANG_BA||'YA').toUpperCase()!=='YA') return {success:false,message:'Pencetakan ulang dinonaktifkan.'};
    if(rec.ba_file_id){ try{ DriveApp.getFileById(rec.ba_file_id).setTrashed(true); }catch(e){} }
    var file=getTPPFolder().createFile(Utilities.newBlob(Utilities.base64Decode(base64),'application/pdf',filename));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    var fid=file.getId(), info=getPICForSkpd(skpd);
    var use=nomor||rec.ba_nomor||(('000'+nextDocNumber('BA-TPP',year,false)).slice(-3)+'/BA-TPP/'+info.kode+'/'+ROMAWI[Number(month)-1]+'/'+year);
    var mm=String(use).match(/^(\d+)/); if(mm) setDocNumberAtLeast('BA-TPP',Number(year),parseInt(mm[1],10));
    var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
    for(var j=0;j<d.length;j++) if(String(d[j][0])===rec.id){ s.getRange(j+2,15,1,4).setValues([[use,fid,new Date(),u.nama]]); break; }
    var tk=tokens||[];
    activateSignatures(tk,fid,actorNip);
    retireSignatures(rec.id,'',tk);
    writeLog(actorNip,'TPP',rec.ba_file_id?'Cetak Ulang Berita Acara':'Buat Berita Acara',rec.id,skpd+' • '+BULAN_ID[Number(month)-1]+' '+year+' • '+use+(tk.length?' • TTD elektronik: '+tk.join(', '):' • TTD manual'));
    return {success:true,nomor:use,file_id:fid,tokens:tk,previewUrl:'https://drive.google.com/file/d/'+fid+'/preview',
      viewUrl:'https://drive.google.com/file/d/'+fid+'/view',downloadUrl:'https://drive.google.com/uc?export=download&id='+fid,
      message:'Berita Acara '+use+' berhasil dibuat.'+(tk.length?' Tanda tangan elektronik aktif.':'')+' Silakan cetak, tanda tangani/stempel bila perlu, lalu unggah kembali.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function uploadBeritaAcaraFinal(skpd,year,month,base64,filename,mimeType,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(u.role==='TeamInternal') return {success:false,message:'Pengunggahan dilakukan oleh admin OPD yang bersangkutan.'};
    if(!ownsSkpd(actorNip,skpd)) return {success:false,message:'Anda tidak berwenang mengunggah untuk SKPD ini.'};
    if(!base64) return {success:false,message:'File belum dipilih.'};
    if(base64.length>15000000) return {success:false,message:'Ukuran file terlalu besar. Maksimal 10MB.'};
    var okType=['application/pdf','image/jpeg','image/jpg','image/png'];
    if(okType.indexOf(String(mimeType).toLowerCase())===-1) return {success:false,message:'Format harus PDF, JPG, atau PNG.'};
    var s=setupTPPSheets(), cfg=getTPPConfig(), map=readTPP(Number(year),cfg), rec=map[tppKey(skpd,year,month)];
    if(!rec||!rec.ba_file_id) return {success:false,message:'Buat draft Berita Acara terlebih dahulu sebelum mengunggah dokumen bertanda tangan.'};
    var old=rec.final_file_id;
    var file=getBAFinalFolder().createFile(Utilities.newBlob(Utilities.base64Decode(base64),mimeType,filename));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    var fid=file.getId(), size=file.getSize();
    var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
    for(var j=0;j<d.length;j++) if(String(d[j][0])===rec.id){ s.getRange(j+2,22,1,6).setValues([[fid,filename,mimeType,size,new Date(),u.nama]]); break; }
    if(old){ try{ DriveApp.getFileById(old).setTrashed(true); }catch(e){} }
    writeLog(actorNip,'TPP',old?'Ganti BA Bertanda Tangan':'Unggah BA Bertanda Tangan',rec.id,skpd+' • '+BULAN_ID[Number(month)-1]+' '+year+' • '+filename);
    return {success:true,file_id:fid,file_name:filename,file_size:size,
      previewUrl:'https://drive.google.com/file/d/'+fid+'/preview',viewUrl:'https://drive.google.com/file/d/'+fid+'/view',
      downloadUrl:'https://drive.google.com/uc?export=download&id='+fid,
      message:'Berita Acara bertanda tangan & berstempel berhasil diunggah.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function deleteBeritaAcaraFinal(skpd,year,month,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
    if(u.role!=='Superadmin'&&!ownsSkpd(actorNip,skpd)) return {success:false,message:'Tidak berwenang.'};
    var s=setupTPPSheets(), cfg=getTPPConfig(), map=readTPP(Number(year),cfg), rec=map[tppKey(skpd,year,month)];
    if(!rec||!rec.final_file_id) return {success:false,message:'Belum ada unggahan BA bertanda tangan.'};
    try{ DriveApp.getFileById(rec.final_file_id).setTrashed(true); }catch(e){}
    var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
    for(var j=0;j<d.length;j++) if(String(d[j][0])===rec.id){ s.getRange(j+2,22,1,6).setValues([['','','',0,'','']]); break; }
    writeLog(actorNip,'TPP','Hapus BA Bertanda Tangan',rec.id,skpd+' • '+BULAN_ID[Number(month)-1]+' '+year);
    return {success:true,message:'Unggahan BA bertanda tangan dihapus. Draft dapat dicetak ulang.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function unlockTPP(skpd,year,month,actorNip){
  try{
    assertRole(actorNip,['Superadmin']);
    var cfg=getTPPConfig(), s=setupTPPSheets(), map=readTPP(Number(year),cfg), rec=map[tppKey(skpd,year,month)];
    if(!rec) return {success:false,message:'Data periode tidak ditemukan.'};
    if(rec.ba_file_id){ try{ DriveApp.getFileById(rec.ba_file_id).setTrashed(true); }catch(e){} }
    if(rec.final_file_id){ try{ DriveApp.getFileById(rec.final_file_id).setTrashed(true); }catch(e){} }
    retireSignatures(rec.id,'',[]);
    var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
    for(var j=0;j<d.length;j++) if(String(d[j][0])===rec.id){
      s.getRange(j+2,15,1,4).setValues([['','','','']]);
      s.getRange(j+2,22,1,6).setValues([['','','',0,'','']]);
      s.getRange(j+2,21).setValue(new Date()); break; }
    writeLog(actorNip,'TPP','Buka Kunci Periode',rec.id,skpd+' • '+BULAN_ID[Number(month)-1]+' '+year);
    return {success:true,message:'Kunci periode '+BULAN_ID[Number(month)-1]+' '+year+' untuk '+skpd+' dibuka. Draft, unggahan BA, dan tanda tangan elektronik dicabut.'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getBeritaAcaraList(year,actorNip){
  try{
    var u=findUserRow(actorNip); if(!u) return [];
    var mine=getSkpdForActor(actorNip), set={}; for(var i=0;i<mine.length;i++) set[canon(mine[i])]=true;
    var s=setupTPPSheets(); if(s.getLastRow()<2) return [];
    var sigMap=readSignaturesMap();
    var d=s.getRange(2,1,s.getLastRow()-1,27).getValues(), out=[];
    for(var j=0;j<d.length;j++){
      if(String(d[j][3])!==String(year)||!String(d[j][15]||'')||!set[canon(d[j][1])]) continue;
      var fid=String(d[j][15]), fin=String(d[j][21]||''), id=String(d[j][0]), sg=sigMap[id]||[], sa=null, sk2=null;
      for(var q=0;q<sg.length;q++){ if(sg[q].status==='DICABUT') continue;
        if(sg[q].peran==='ADMIN') sa=sg[q]; else if(sg[q].peran==='KEPALA') sk2=sg[q]; }
      out.push({id:id,skpd:String(d[j][1]),bulan:Number(d[j][4]),bulanNama:BULAN_ID[Number(d[j][4])-1],tahun:String(d[j][3]),
        nomor:String(d[j][14]),file_id:fid,pic_nip:String(d[j][18]||''),pic_nama:String(d[j][19]||''),dibuat:fmtDT(d[j][16]),oleh:String(d[j][17]||''),
        final_file_id:fin,final_name:String(d[j][22]||''),final_size:Number(d[j][24]||0),final_upload:fmtDT(d[j][25]),final_by:String(d[j][26]||''),
        sig_admin:sa,sig_kepala:sk2,canUpload:u.role!=='TeamInternal',
        previewUrl:'https://drive.google.com/file/d/'+fid+'/preview',viewUrl:'https://drive.google.com/file/d/'+fid+'/view',
        downloadUrl:'https://drive.google.com/uc?export=download&id='+fid}); }
    out.sort(function(a,b){ return a.skpd.localeCompare(b.skpd)||a.bulan-b.bulan; });
    return out;
  }catch(e){ return []; }
}
function getTPPMonitorByPIC(year,actorNip){
  try{ assertRole(actorNip,['Superadmin']);
    var r=getTPPMatrix(year,actorNip), by={};
    for(var i=0;i<r.rows.length;i++){ var row=r.rows[i], k=row.pic_nip||'-';
      if(!by[k]) by[k]={pic_nip:k,pic_nama:row.pic_nama||'Tanpa PIC',skpd:0,lengkap:0,sebagian:0,belum:0,ba:0,final:0};
      by[k].skpd++; by[k].lengkap+=row.lengkap; by[k].sebagian+=row.sebagian; by[k].belum+=row.belum; by[k].ba+=row.ba_count; by[k].final+=row.final_count; }
    var out=[]; for(var x in by) out.push(by[x]);
    out.sort(function(a,b){ return b.lengkap-a.lengkap; }); return out;
  }catch(e){ return []; }
}

//============================================
// HELPER
//============================================
function formatTimeValue(v){
  if(!v) return '';
  if(v instanceof Date&&!isNaN(v.getTime())) return String(v.getHours()).padStart(2,'0')+':'+String(v.getMinutes()).padStart(2,'0');
  var s=String(v).trim().toUpperCase(), m=s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if(m){ var h=parseInt(m[1],10); if(m[3].toUpperCase()==='PM'&&h<12)h+=12; if(m[3].toUpperCase()==='AM'&&h===12)h=0; return String(h).padStart(2,'0')+':'+m[2]; }
  var m2=s.match(/^(\d{1,2}):(\d{2})$/); if(m2) return m2[1].padStart(2,'0')+':'+m2[2]; return String(v);
}
function formatTanggalValue(v){
  if(!v) return '';
  if(v instanceof Date&&!isNaN(v.getTime())) return Utilities.formatDate(v,TZ(),'yyyy-MM-dd');
  return String(v).substring(0,10);
}
function formatTanggalIndo(v){
  if(!v) return '-';
  var d=v instanceof Date?v:new Date(v); if(isNaN(d.getTime())) return String(v);
  return HARI_ID[d.getDay()]+', '+d.getDate()+' '+BULAN_ID[d.getMonth()]+' '+d.getFullYear();
}
function getOrCreateMediaFolder(){ var f=DriveApp.getFoldersByName('KENDALI_Media'); return f.hasNext()?f.next():DriveApp.createFolder('KENDALI_Media'); }
function getDisplayableMediaUrl(id){ return 'https://lh3.googleusercontent.com/d/'+id; }
function getDownloadUrl(id){ return 'https://drive.google.com/uc?export=download&id='+id; }
function getViewUrl(id){ return 'https://drive.google.com/file/d/'+id+'/view'; }
function getWebAppUrl(){ try{ return ScriptApp.getService().getUrl(); }catch(e){ return ''; } }
function uploadMediaToDrive(base64,filename,mimeType,actorNip){
  try{ if(actorNip) assertRole(actorNip,['Superadmin','TeamInternal']);
    var file=getOrCreateMediaFolder().createFile(Utilities.newBlob(Utilities.base64Decode(base64),mimeType,filename));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    var id=file.getId();
    return {success:true,id:id,name:filename,type:mimeType,isVideo:String(mimeType).indexOf('video/')===0,displayUrl:getDisplayableMediaUrl(id),viewUrl:getViewUrl(id),downloadUrl:getDownloadUrl(id)};
  }catch(e){ return {success:false,error:e.message}; }
}
function deleteMediaFromDrive(id){ try{ DriveApp.getFileById(id).setTrashed(true); return {success:true}; }catch(e){ return {success:false,error:e.message}; } }
function getDashboardStats(actorNip){
  var empty={totalAgenda:0,agendaHariIni:0,totalNotulen:0,notulenBulanIni:0};
  try{
    var u=findUserRow(actorNip); if(!u||u.role==='UserOPD') return empty;
    var ss=SpreadsheetApp.getActiveSpreadsheet(), a=ss.getSheetByName('Data_Agenda'), n=ss.getSheetByName('Data_Notulen');
    var st={totalAgenda:0,agendaHariIni:0,totalNotulen:0,notulenBulanIni:0};
    var today=new Date(), ts=Utilities.formatDate(today,TZ(),'yyyy-MM-dd'), cm=today.getMonth(), cy=today.getFullYear();
    if(a&&a.getLastRow()>1){ var d=a.getDataRange().getValues(); st.totalAgenda=d.length-1;
      for(var i=1;i<d.length;i++) if(d[i][1]&&formatTanggalValue(d[i][1])===ts) st.agendaHariIni++; }
    if(n&&n.getLastRow()>1){ var e=n.getDataRange().getValues(); st.totalNotulen=e.length-1;
      for(var j=1;j<e.length;j++) if(e[j][1]){ var dt=e[j][1] instanceof Date?e[j][1]:new Date(e[j][1]);
        if(!isNaN(dt.getTime())&&dt.getMonth()===cm&&dt.getFullYear()===cy) st.notulenBulanIni++; } }
    return st;
  }catch(e){ return empty; }
}
function getNotulenStats(actorNip){
  var empty={total:0,bulanIni:0,mingguIni:0,notulisAktif:'-',notulisAktifCount:0};
  try{
    var u=findUserRow(actorNip); if(!u||u.role==='UserOPD') return empty;
    var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_Notulen'); if(!s||s.getLastRow()<2) return empty;
    var today=new Date(), cm=today.getMonth(), cy=today.getFullYear(), wa=new Date(today); wa.setDate(today.getDate()-7);
    var d=s.getDataRange().getValues(), st={total:d.length-1,bulanIni:0,mingguIni:0,notulisAktif:'-',notulisAktifCount:0}, c={};
    for(var i=1;i<d.length;i++){
      if(d[i][1]){ var dt=d[i][1] instanceof Date?d[i][1]:new Date(d[i][1]);
        if(!isNaN(dt.getTime())){ if(dt.getMonth()===cm&&dt.getFullYear()===cy)st.bulanIni++; if(dt>=wa)st.mingguIni++; } }
      var nn=String(d[i][6]||'').trim(); if(nn)c[nn]=(c[nn]||0)+1; }
    var mx=0; for(var k in c) if(c[k]>mx){ mx=c[k]; st.notulisAktif=k; st.notulisAktifCount=mx; }
    return st;
  }catch(e){ return empty; }
}
function getPegawaiData(){
  try{ var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_Pegawai'); if(!s||s.getLastRow()<2) return [];
    var d=s.getDataRange().getValues(); d.shift();
    return d.map(function(r){ return {nip:String(r[0]||''),nama:String(r[1]||''),pangkat:String(r[2]||''),jabatan:String(r[3]||''),tanggal_lahir:formatTanggalValue(r[4]),email:String(r[5]||'').trim().toLowerCase()}; });
  }catch(e){ return []; }
}
function checkBirthdays(){
  try{ var p=getPegawaiData(), t=new Date(), m=t.getMonth()+1, d=t.getDate();
    return p.filter(function(x){ if(!x.tanggal_lahir) return false; var b=new Date(x.tanggal_lahir); return !isNaN(b.getTime())&&(b.getMonth()+1)===m&&b.getDate()===d; });
  }catch(e){ return []; }
}
function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).toLowerCase()); }
function kirimEmailNotifAgenda(ad,pjList,mode,pjLama){
  try{
    if(!pjList||!pjList.length) return {success:false,message:'Tidak ada PJ',berhasil:0,gagal:0,daftarTerkirim:[],daftarGagal:[]};
    var all=getPegawaiData(), ok=0, fail=0, sent=[], failed=[];
    var uniq=[...new Set(pjList.map(function(x){return String(x).trim();}).filter(function(x){return x;}))];
    uniq.forEach(function(nip){
      var p=all.find(function(x){return x.nip===nip;});
      if(!p){ fail++; failed.push({nip:nip,alasan:'NIP tidak ditemukan'}); return; }
      if(!p.email||!isValidEmail(p.email)){ fail++; failed.push({nip:nip,nama:p.nama,alasan:'Email tidak valid'}); return; }
      var st=(mode==='edit'&&pjLama&&pjLama.length)?(pjLama.indexOf(nip)>-1?'update':'baru'):'baru';
      try{ MailApp.sendEmail({to:p.email,subject:(st==='baru'?'[KENDALI] 📌 Penugasan Baru: ':'[KENDALI] 🔄 Update Agenda: ')+ad.nama_kegiatan,
          htmlBody:generateEmailTemplateAgenda(ad,p,st,uniq,all),name:'Sistem KENDALI',replyTo:Session.getActiveUser().getEmail()});
        ok++; sent.push({nip:nip,nama:p.nama,email:p.email,status:st}); Utilities.sleep(400);
      }catch(e){ fail++; failed.push({nip:nip,nama:p.nama,email:p.email,alasan:e.message}); } });
    var msg=''; if(ok>0) msg+='✅ Email terkirim ke '+ok+' penerima'; if(fail>0) msg+=(msg?'\n':'')+'⚠️ '+fail+' email gagal';
    return {success:ok>0,berhasil:ok,gagal:fail,message:msg,daftarTerkirim:sent,daftarGagal:failed,mode:mode||'baru'};
  }catch(e){ return {success:false,message:'Error: '+e.message,berhasil:0,gagal:0,daftarTerkirim:[],daftarGagal:[]}; }
}
function generateEmailTemplateAgenda(a,p,st,nips,all){
  var t1=formatTanggalIndo(a.tanggal_mulai), t2=(a.tanggal_selesai&&a.tanggal_selesai!==a.tanggal_mulai)?' s.d. '+formatTanggalIndo(a.tanggal_selesai):'';
  var url=getWebAppUrl(), pj='';
  if(nips&&nips.length){ var nm=nips.map(function(n){ var x=all.find(function(y){return y.nip===n;}); return x?x.nama:n; });
    pj='<div style="margin-top:15px;padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #8b5cf6;"><div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:6px;">👥 PENANGGUNG JAWAB ('+nips.length+' orang):</div><div style="font-size:12px;color:#1e293b;line-height:1.8;">'+nm.map(function(n,i){return (i+1)+'. '+n;}).join('<br>')+'</div></div>'; }
  var badge=st==='baru'?'<span style="background:#10b981;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;">✨ PENUGASAN BARU</span>':'<span style="background:#f59e0b;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;">🔄 UPDATE AGENDA</span>';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Segoe UI,Arial,sans-serif;background:#f1f5f9;"><div style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.1);"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:30px;text-align:center;color:#fff;"><div style="font-size:28px;font-weight:800;letter-spacing:2px;">KENDALI</div><div style="font-size:12px;opacity:.9;margin-top:4px;">Bagian Organisasi Setda Kab. Banyuwangi</div><div style="margin-top:12px;">'+badge+'</div></div><div style="padding:30px;"><p style="margin:0 0 10px;color:#64748b;font-size:13px;">Yth.</p><p style="margin:0 0 5px;font-size:18px;font-weight:700;color:#1e293b;">'+p.nama+'</p><p style="margin:0 0 20px;font-size:13px;color:#64748b;">'+p.jabatan+'</p><p style="color:#475569;font-size:14px;line-height:1.6;">'+(st==='baru'?'Anda <strong>ditugaskan</strong> pada kegiatan:':'Terdapat <strong>perubahan</strong> pada kegiatan:')+'</p><div style="background:linear-gradient(135deg,#eef2ff,#fdf4ff);border-radius:12px;padding:20px;border-left:4px solid #6366f1;margin:20px 0;"><div style="font-size:18px;font-weight:700;color:#4f46e5;margin-bottom:15px;">📋 '+a.nama_kegiatan+'</div><table style="width:100%;font-size:13px;"><tr><td style="padding:8px 0;color:#64748b;width:110px;">📅 Tanggal</td><td style="padding:8px 0;color:#1e293b;font-weight:600;">'+t1+t2+'</td></tr><tr><td style="padding:8px 0;color:#64748b;">⏰ Waktu</td><td style="padding:8px 0;color:#1e293b;font-weight:600;">'+a.waktu_mulai+' WIB</td></tr><tr><td style="padding:8px 0;color:#64748b;">📍 Lokasi</td><td style="padding:8px 0;color:#1e293b;font-weight:600;">'+a.lokasi+'</td></tr>'+(a.keterangan?'<tr><td style="padding:8px 0;color:#64748b;vertical-align:top;">📝 Keterangan</td><td style="padding:8px 0;color:#1e293b;">'+a.keterangan+'</td></tr>':'')+'</table>'+pj+'</div><div style="text-align:center;margin:25px 0;"><a href="'+url+'" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff!important;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">🚀 Buka KENDALI</a></div></div><div style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e2e8f0;"><p style="margin:0;font-size:11px;color:#64748b;">© 2026 <strong style="color:#6366f1;">KENDALI</strong></p></div></div></body></html>';
}

//============================================
// AGENDA & NOTULEN CRUD
//============================================
function saveAgenda(f){
  try{
    assertRole(f.actor_nip,['Superadmin','TeamInternal']);
    var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Data_Agenda');
    if(!s){ s=ss.insertSheet('Data_Agenda'); s.appendRow(['ID','Tanggal_Mulai','Tanggal_Selesai','Waktu_Mulai','Nama_Kegiatan','Lokasi','PJ_NIP','PJ_Nama','Keterangan','Tanggal_Input']); s.getRange(1,1,1,10).setFontWeight('bold').setBackground('#eef2ff'); }
    var isNew=!f.id, id=f.id||('AGD-'+Utilities.getUuid().substring(0,6));
    var d=s.getDataRange().getValues(), ri=-1, oldPj='';
    for(var i=1;i<d.length;i++) if(String(d[i][0])===String(id)){ ri=i+1; oldPj=String(d[i][6]||''); break; }
    var pjNip=f.pj_nip?String(f.pj_nip).trim():'', pjNama=f.pj_nama?String(f.pj_nama).trim():'';
    var row=[id,f.tanggal_mulai||'',f.tanggal_selesai||'',f.waktu_mulai||'',f.nama_kegiatan||'',f.lokasi||'',pjNip,pjNama,f.keterangan||'',new Date()];
    if(ri>0) s.getRange(ri,1,1,10).setValues([row]); else s.appendRow(row);
    var target=pjNip===''?['197806172002121000']:pjNip.split(',').map(function(x){return x.trim();}).filter(function(x){return x;});
    var er=null;
    if(target.length){ var ad={nama_kegiatan:f.nama_kegiatan,tanggal_mulai:f.tanggal_mulai,tanggal_selesai:f.tanggal_selesai,waktu_mulai:f.waktu_mulai,lokasi:f.lokasi,keterangan:f.keterangan};
      er=isNew?kirimEmailNotifAgenda(ad,target,'baru',[]):kirimEmailNotifAgenda(ad,target,'edit',oldPj.split(',').map(function(x){return x.trim();}).filter(function(x){return x;})); }
    var msg='Data Agenda berhasil disimpan!';
    if(er){ msg+='\n'+er.message; if(er.daftarTerkirim&&er.daftarTerkirim.length) msg+='\n📨 Penerima: '+er.daftarTerkirim.map(function(p){return p.nama;}).join(', '); }
    writeLog(f.actor_nip,'Agenda',isNew?'Tambah':'Edit',id,row[4]);
    return {success:true,message:msg,emailResult:er,pj_count:pjNip===''?0:pjNip.split(',').length,mode:isNew?'baru':'edit'};
  }catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getAgendaData(actorNip){
  try{ var u=findUserRow(actorNip); if(!u||u.role==='UserOPD') return [];
    var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_Agenda'); if(!s||s.getLastRow()<2) return [];
    var d=s.getDataRange().getValues(); d.shift();
    return d.map(function(r){ return {id:String(r[0]||''),tanggal_mulai:formatTanggalValue(r[1]),tanggal_selesai:formatTanggalValue(r[2]),waktu_mulai:formatTimeValue(r[3]),nama_kegiatan:String(r[4]||''),lokasi:String(r[5]||''),pj_nip:String(r[6]||''),pj_nama:String(r[7]||''),keterangan:String(r[8]||'')}; });
  }catch(e){ return []; }
}
function deleteAgenda(id,actorNip){
  try{ assertRole(actorNip,['Superadmin','TeamInternal']);
    var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_Agenda'); if(!s) return 'Sheet tidak ditemukan!';
    var d=s.getDataRange().getValues();
    for(var i=1;i<d.length;i++) if(String(d[i][0])===String(id)){ var nm=String(d[i][4]); s.deleteRow(i+1); writeLog(actorNip,'Agenda','Hapus',id,nm); return 'Data berhasil dihapus!'; }
    return 'Data tidak ditemukan!';
  }catch(e){ return 'Error: '+e.message; }
}
function normalizeMediaUrls(arr){
  if(!Array.isArray(arr)) return [];
  return arr.map(function(m){ if(!m||!m.id) return m; return Object.assign({},m,{displayUrl:m.displayUrl||getDisplayableMediaUrl(m.id),viewUrl:m.viewUrl||getViewUrl(m.id),downloadUrl:m.downloadUrl||getDownloadUrl(m.id)}); });
}
function saveNotulen(f){
  try{
    assertRole(f.actor_nip,['Superadmin','TeamInternal']);
    var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Data_Notulen');
    if(!s){ s=ss.insertSheet('Data_Notulen'); s.appendRow(['ID','Tanggal_Rapat','Nama_Rapat','Lokasi','Pimpinan_Rapat','Notulis_NIP','Notulis_Nama','Peserta','Agenda','Pembahasan','Tindak_Lanjut','Media_URLs','Tanggal_Input']); s.getRange(1,1,1,13).setFontWeight('bold').setBackground('#fdf2f8'); }
    var id=f.id||('NOT-'+Utilities.getUuid().substring(0,6)), d=s.getDataRange().getValues(), ri=-1;
    for(var i=1;i<d.length;i++) if(String(d[i][0])===String(id)){ ri=i+1; break; }
    var mu=f.media_urls||'[]';
    if(f.id&&ri>0){ var ex=String(d[ri-1][11]||'[]');
      if(!f.media_urls||f.media_urls==='[]') mu=ex;
      else { try{ mu=JSON.stringify(JSON.parse(ex).concat(JSON.parse(f.media_urls))); }catch(e){ mu=f.media_urls; } } }
    var row=[id,f.tanggal_rapat||'',f.nama_rapat||'',f.lokasi||'',f.pimpinan_rapat||'',f.notulis_nip||'',f.notulis_nama||'',f.peserta||'',f.agenda||'',f.pembahasan||'',f.tindak_lanjut||'',mu,new Date()];
    if(ri>0) s.getRange(ri,1,1,13).setValues([row]); else s.appendRow(row);
    writeLog(f.actor_nip,'Notulen',f.id?'Edit':'Tambah',id,row[2]);
    return 'Data Notulen berhasil disimpan!';
  }catch(e){ return 'Error: '+e.message; }
}
function getNotulenData(actorNip){
  try{ var u=findUserRow(actorNip); if(!u||u.role==='UserOPD') return [];
    var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_Notulen'); if(!s||s.getLastRow()<2) return [];
    var d=s.getDataRange().getValues(); d.shift();
    return d.map(function(r){ var m=[]; try{ m=JSON.parse(String(r[11]||'[]')); if(!Array.isArray(m)) m=[]; }catch(e){ m=[]; }
      return {id:String(r[0]||''),tanggal_rapat:formatTanggalValue(r[1]),nama_rapat:String(r[2]||''),lokasi:String(r[3]||''),pimpinan_rapat:String(r[4]||''),notulis_nip:String(r[5]||''),notulis_nama:String(r[6]||''),peserta:String(r[7]||''),agenda:String(r[8]||''),pembahasan:String(r[9]||''),tindak_lanjut:String(r[10]||''),media_urls:normalizeMediaUrls(m)}; });
  }catch(e){ return []; }
}
function deleteNotulen(id,actorNip){
  try{ assertRole(actorNip,['Superadmin','TeamInternal']);
    var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_Notulen'); if(!s) return 'Sheet tidak ditemukan!';
    var d=s.getDataRange().getValues();
    for(var i=1;i<d.length;i++) if(String(d[i][0])===String(id)){ var nm=String(d[i][2]);
      try{ JSON.parse(String(d[i][11]||'[]')).forEach(function(m){ if(m&&m.id) try{ DriveApp.getFileById(m.id).setTrashed(true); }catch(e){} }); }catch(e){}
      s.deleteRow(i+1); writeLog(actorNip,'Notulen','Hapus',id,nm); return 'Data berhasil dihapus!'; }
    return 'Data tidak ditemukan!';
  }catch(e){ return 'Error: '+e.message; }
}
function deleteNotulenMedia(nid,mid,actorNip){
  try{ assertRole(actorNip,['Superadmin','TeamInternal']);
    var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_Notulen'), d=s.getDataRange().getValues();
    for(var i=1;i<d.length;i++) if(String(d[i][0])===String(nid)){
      var m=[]; try{ m=JSON.parse(String(d[i][11]||'[]')); }catch(e){}
      m=m.filter(function(x){ return String(x.id)!==String(mid); });
      s.getRange(i+1,12).setValue(JSON.stringify(m));
      try{ DriveApp.getFileById(mid).setTrashed(true); }catch(e){}
      return {success:true}; }
    return {success:false,error:'Notulen tidak ditemukan'};
  }catch(e){ return {success:false,error:e.message}; }
}


//============================================
// GENERATOR PEMBERITUAN AWAL BULAN (WhatsApp)
//============================================
function generatePemberitahuanTPP(bulan, tahun, actorNip){
  try{
    var u=findUserRow(actorNip);
    if(!u) return {success:false, message:'Sesi tidak valid.'};
    if(u.role!=='Superadmin' && u.role!=='TeamInternal')
      return {success:false, message:'Akses ditolak. Fitur ini hanya untuk Team Internal & Superadmin.'};
    
    var bl=Number(bulan), th=Number(tahun);
    if(bl<1||bl>12||!th) return {success:false, message:'Bulan/Tahun tidak valid.'};
    
    var namaBulan=BULAN_ID[bl-1];
    var skpdList=getSkpdForActor(actorNip);
    if(!skpdList.length && u.role!=='Superadmin')
      return {success:false, message:'Tidak ada SKPD yang terhubung dengan akun ini.'};
    
    var pa=getPeriodeAktif();
    var bulanAktif=pa.bulanNama;
    var tahunAktif=pa.tahun;
    var linkApp='https://s.id/siKENDALI';
    
    var skpdText='';
    if(u.role==='Superadmin'){
      skpdText='Kepada Yth. Seluruh Admin TPP OPD di Lingkungan Pemerintah Kabupaten Banyuwangi,';
    } else {
      skpdText='Kepada Yth. Bapak/Ibu Admin TPP pada OPD berikut:\n';
      for(var i=0;i<skpdList.length;i++) skpdText+='• '+skpdList[i]+'\n';
    }
    
    var pesan='═══════════════════════════════\n';
    pesan+='📢 *PEMBERITUAN AWAL BULAN*\n';
    pesan+='*Persetujuan TPP & e-Kinerja*\n';
    pesan+='═══════════════════════════════\n\n';
    pesan+=skpdText+'\n\n';
    pesan+='Bersama ini kami sampaikan beberapa hal yang perlu ditindaklanjuti pada bulan *'+namaBulan+' '+tahun+'*:\n\n';
    pesan+='*1️⃣ PENGISIAN e-KINERJA*\n';
    pesan+='Mohon mengingatkan seluruh pegawai pada OPD masing-masing untuk segera mengisi e-Kinerja (rencana & capaian kinerja bulanan) mulai:\n';
    pesan+='📅 Tanggal 1 s.d. paling lambat *tanggal 7 bulan berjalan*\n';
    pesan+='⚠️ Keterlambatan pengisian akan berdampak pada penilaian kinerja pegawai.\n\n';
    pesan+='*2️⃣ PERSETUJUAN TPP di KENDALI*\n';
    pesan+='Mohon Bapak/Ibu Admin TPP melakukan:\n';
    pesan+='✅ Login ke aplikasi KENDALI di '+linkApp+'\n';
    pesan+='✅ Buka menu *Persetujuan TPP → Isi Persetujuan*\n';
    pesan+='✅ Lakukan centang konfirmasi tanggal 7 & tanggal 10 sesuai periode yang berjalan\n';
    pesan+='✅ Buat & cetak Draft Berita Acara, lalu tandatangani oleh Kepala OPD & bubuhkan stempel\n';
    pesan+='✅ Unggah kembali Berita Acara yang telah ditandatangani ke aplikasi\n\n';
    pesan+='*🔐 KREDENSIAL LOGIN:*\n';
    pesan+='🔗 '+linkApp+'\n';
    pesan+='👤 NIP / ID User: sesuai data yang telah diberikan\n';
    pesan+='🔑 Password: sesuai data yang telah diberikan\n\n';
    pesan+='*📞 Dukungan Teknis:*\n';
    pesan+='Bila mengalami kendala teknis atau lupa password, silakan menghubungi PIC Pendamping wilayah masing-masing atau Tim KENDALI Bagian Organisasi.\n\n';
    pesan+='─────────────────────────────\n';
    pesan+='Hormat kami,\n';
    pesan+='*'+u.nama+'*\n';
    pesan+='Tim KENDALI — Bagian Organisasi\n';
    pesan+='Setda Kabupaten Banyuwangi\n';
    pesan+='─────────────────────────────';
    
    writeLog(actorNip, 'TPP', 'Generate Pemberitahuan', namaBulan+' '+tahun, 
             'Dikirim ke '+(u.role==='Superadmin'?'seluruh OPD':skpdList.length+' SKPD'));
    
    return {
      success:true, 
      pesan:pesan,
      bulanNama:namaBulan,
      tahun:th,
      jumlahSKPD:u.role==='Superadmin'?OPD_LIST().length:skpdList.length,
      dikirimOleh:u.nama,
      linkApp:linkApp
    };
  }catch(e){ return {success:false, message:'Error: '+e.message}; }
}

//============================================
// PANDUAN PENGGUNAAN TPP
//============================================
function getPanduanTPP(actorNip){
return {
versi:'1.0',
    updateTerakhir:'23 November 2026',
    judul:'Panduan Persetujuan TPP — KENDALI',
    pendahuluan:'Aplikasi KENDALI adalah sistem digital Bagian Organisasi Setda Kab. Banyuwangi untuk mengelola persetujuan Tambahan Penghasilan Pegawai (TPP) 54 SKPD. Alur utama: centang konfirmasi → buat Berita Acara → tandatangani → unggah dokumen final.',
    bagian:[
      {
        judul:'A. Untuk Admin OPD (User OPD)',
        icon:'👤',
        langkah:[
          {
            judul:'1. Login ke KENDALI',
            isi:'Buka https://s.id/siKENDALI. Masukkan NIP/ID User dan password yang telah diberikan. Setelah login, Anda otomatis diarahkan ke dashboard OPD Anda.'
          },
          {
            judul:'2. Lengkapi Profil OPD & TTD (sekali di awal)',
            isi:'Buka menu PERSETUJUAN TPP → Profil OPD & TTD. Isi data Pengelola Admin TPP dan Kepala OPD (nama, NIP, pangkat, jabatan). Pilih metode tanda tangan: ELEKTRONIK (QR verifikasi, direkomendasikan) atau MANUAL (gambar TTD basah). Simpan. Bila Kepala OPD ingin keamanan tambahan, isi PIN persetujuan (minimal 4 digit).'
          },
          {
            judul:'3. Isi Konfirmasi TPP tiap bulan',
            isi:'Buka Isi Persetujuan. Pastikan tahun dan SKPD sudah benar. Centang checkbox Tanggal 7 dan Tanggal 10 sesuai realisasi pada OPD Anda. Kedua centang harus lengkap agar status menjadi "Lengkap".'
          },
          {
            judul:'4. Buat Draft Berita Acara',
            isi:'Setelah status "Lengkap", klik tombol "Buat Berita Acara". Pilih metode tanda tangan untuk Admin & Kepala OPD (sesuai profil). Bila Kepala OPD memakai PIN, masukkan PIN saat diminta. Klik Proses & Buat PDF.'
          },
          {
            judul:'5. Cetak, Tandatangani, Stempel',
            isi:'Unduh draft PDF. Cetak di kertas. Minta tanda tangan Kepala OPD & Pengelola Admin, bubuhkan stempel OPD. Scan hasilnya sebagai PDF (atau foto JPG/PNG, maksimal 10 MB).'
          },
          {
            judul:'6. Unggah BA Bertanda Tangan',
            isi:'Kembali ke kartu bulan tersebut, klik "Unggah BA Bertanda Tangan & Stempel". Pilih file hasil scan. Status berubah menjadi "Final / Ditandatangani".'
          },
          {
            judul:'7. Melihat Tanda Tangan Elektronik (QR)',
            isi:'Klik tombol "QR Admin" atau "QR Kepala" pada kartu bulan untuk melihat barcode. Pindai barcode untuk memverifikasi keaslian. Halaman verifikasi publik menampilkan nama, pangkat, NIP, jabatan, serta tanggal & jam penandatanganan.'
          }
        ]
      },
      {
        judul:'B. Untuk Tim Internal (PIC Pendamping)',
        icon:'👥',
        langkah:[
          {
            judul:'1. Monitoring Wilayah Binaan',
            isi:'Buka PERSETUJUAN TPP → Monitoring Wilayah. Tabel menampilkan seluruh SKPD binaan Anda dengan status centang tanggal 7 & 10, draft BA, dan BA final. Gunakan filter "Semua PIC Pendamping" untuk melihat wilayah Anda saja.'
          },
          {
            judul:'2. Kirim Pemberitahuan Bulanan',
            isi:'Buka PERSETUJUAN TPP → Generate Pemberitahuan. Pilih bulan & tahun, klik Generate. Teks siap kirim ke WhatsApp Grup Admin TPP akan otomatis tersalin.'
          },
          {
            judul:'3. Rekap & Export',
            isi:'Dari Monitoring, gunakan tombol Export (Excel) atau Cetak untuk laporan bulanan ke Bagian Organisasi.'
          }
        ]
      },
      {
        judul:'C. Untuk Superadmin',
        icon:'👑',
        langkah:[
          {
            judul:'1. Konfigurasi TPP',
            isi:'Buka Rekap & Konfigurasi. Atur parameter: metode TTD default, kunci periode, izin cetak ulang, wajib BA final, dll.'
          },
          {
            judul:'2. Buka Kunci Periode',
            isi:'Bila ada OPD yang perlu memperbaiki data setelah draft BA dibuat, gunakan tombol "Buka Kunci Periode" di modal detail bulan. Draft BA dan tanda tangan elektronik akan dicabut.'
          },
          {
            judul:'3. Cabut Tanda Tangan Elektronik',
            isi:'Klik tombol QR pada periode yang bersangkutan, lalu "Cabut". Halaman verifikasi akan menampilkan status DICABUT.'
          },
          {
            judul:'4. Manajemen User',
            isi:'Tambah/edit/hapus akun; reset password; sinkronkan OPD baru ke sheet Data_Users.'
          }
        ]
      },
      {
        judul:'D. Tanya Jawab Umum (FAQ)',
        icon:'❓',
        faq:[
          {q:'Apa perbedaan TTD Elektronik dan Manual?', a:'Elektronik menghasilkan barcode QR berisi tautan verifikasi (nama, NIP, tanggal). Manual menampilkan gambar tanda tangan atau "ttd." untuk ditandatangani basah. Keduanya sah, namun elektronik lebih cepat & dapat diverifikasi publik.'},
          {q:'Apa itu PIN Persetujuan?', a:'Kode rahasia 4+ digit yang ditetapkan di Profil OPD untuk Kepala OPD. Diperlukan setiap kali Kepala OPD bertanda tangan elektronik. Bila lupa, admin OPD dapat mengganti/hapus PIN di menu Profil OPD & TTD.'},
          {q:'Periode terkunci, apa yang harus dilakukan?', a:'Periode otomatis terkunci saat draft BA dibuat. Jika perlu perbaikan data, hubungi Superadmin untuk membuka kunci (draft BA akan dicabut).'},
          {q:'Lupa password?', a:'Klik "Reset Password" di menu Profil Anda (jika User OPD) atau minta Superadmin mereset via Manajemen User ke "password123".'},
          {q:'Kapan tenggat konfirmasi?', a:'Tanggal 7 dibuka pada tanggal 7 bulan berikutnya; tanggal 10 dibuka pada tanggal 10 bulan berikutnya (mode KETAT default).'},
          {q:'File BA Final maksimal berapa?', a:'10 MB, format PDF/JPG/PNG.'},
          {q:'Apakah data TPP periode lama hilang jika PIC berganti?', a:'Tidak. Data TPP melekat pada SKPD, bukan pada PIC. Saat wilayah berganti, akses berpindah ke PIC baru, namun seluruh riwayat centang & BA tetap utuh.'}
        ]
      },
      getKontakDukunganTPP(actorNip)
    ]
  };
}


//============================================
// BLOK HELPER TPP (WAJIB ADA)
//============================================
function TZ(){ return Session.getScriptTimeZone(); }
function fmtDT(v){ return v?Utilities.formatDate(new Date(v),TZ(),'dd/MM/yyyy HH:mm'):''; }
function dtParts(v){
  if(!v) return {tgl:'',jam:''};
  var d=(v instanceof Date)?v:new Date(v); if(isNaN(d.getTime())) return {tgl:'',jam:''};
  return {tgl:Utilities.formatDate(d,TZ(),'dd/MM/yyyy'),jam:Utilities.formatDate(d,TZ(),'HH.mm')};
}
function tglPanjang(v){
  var d=(v instanceof Date)?v:new Date(v); if(isNaN(d.getTime())) return '-';
  return HARI_ID[d.getDay()]+', '+d.getDate()+' '+BULAN_ID[d.getMonth()]+' '+d.getFullYear();
}
function normMetode(v){ return String(v||'').toUpperCase().indexOf('MAN')>-1?'MANUAL':'ELEKTRONIK'; }
function getPeriodeAktif(){
  var n=new Date(), y=n.getFullYear(), m=n.getMonth()+1, pm=m-1, py=y;
  if(pm===0){ pm=12; py=y-1; }
  return {tahun:py,bulan:pm,label:BULAN_ID[pm-1]+' '+py,romawi:ROMAWI[pm-1],
    konfirmasiTahun:y,konfirmasiBulan:m,konfirmasiLabel:BULAN_ID[m-1]+' '+y};
}
function periodeLE(y,m,ay,am){ return (Number(y)<ay)||(Number(y)===ay&&Number(m)<=am); }
function windowOpen(y,m,which,cfg,now){
  if(String(cfg.BATAS_TANGGAL_KONFIRMASI||'KETAT').toUpperCase()!=='KETAT') return {open:true,label:''};
  var ny=Number(y), nm=Number(m)+1; if(nm>12){ nm=1; ny++; }
  var day=(String(which)==='7')?7:10, open=new Date(ny,nm-1,day,0,0,0);
  return {open:now.getTime()>=open.getTime(),label:day+' '+BULAN_ID[nm-1]+' '+ny};
}
function sha256Hex(s){
  var b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8),h='';
  for(var i=0;i<b.length;i++){ var x=(b[i]<0?b[i]+256:b[i]).toString(16); if(x.length<2) x='0'+x; h+=x; }
  return h.toUpperCase();
}
function getSignSecret(){
  var p=PropertiesService.getScriptProperties(),k='KENDALI_SIGN_SECRET',v=p.getProperty(k);
  if(!v){ v=Utilities.getUuid()+'-'+Utilities.getUuid(); p.setProperty(k,v); }
  return v;
}
function pinHash(skpd,pin){ return sha256Hex(getSignSecret()+'|PIN|'+canon(skpd)+'|'+String(pin)); }
function resolvePICNip(nip, nama){
  var map=SKPD_PIC_MAP(), i;
  var n=String(nip==null?'':nip).trim();
  for(i=0;i<map.length;i++) if(map[i].pic_nip===n) return n;
  var cn=canon(nama);
  if(cn) for(i=0;i<map.length;i++) if(canon(map[i].pic_nama)===cn) return map[i].pic_nip;
  var utoks=String(nip==null?'':nip).toLowerCase().split(/[^a-z0-9]+/).filter(function(t){ return t.length>=4; });
  if(!utoks.length) utoks=String(nip==null?'':nip).toLowerCase().split(/[^a-z0-9]+/).filter(function(t){ return t.length>=3; });
  if(utoks.length){
    for(i=0;i<map.length;i++){
      var ptoks=map[i].pic_nama.toLowerCase().split(/[^a-z0-9]+/);
      var ok=true;
      for(var t=0;t<utoks.length;t++){ if(ptoks.indexOf(utoks[t])===-1){ ok=false; break; } }
      if(ok) return map[i].pic_nip;
    }
  }
  return null;
}


//============================================
// BLOK PERBAIKAN AKHIR — JANGAN DIHAPUS
//============================================
var NL=String.fromCharCode(10);

function getBankData(actorNip,filter){
try{
assertRole(actorNip,['Superadmin','TeamInternal']);
var s=setupBankDataSheet(); if(s.getLastRow()<2) return [];
var d=s.getRange(2,1,s.getLastRow()-1,20).getValues(), out=[], f=filter||{}, q=String(f.q||'').toLowerCase();
for(var i=0;i<d.length;i++){
if(!String(d[i][0]||'')) continue;
var o=bdRowToObj(d[i]); o.rowIndex=i+2;
if(f.jenis&&o.jenis!==f.jenis) continue;
if(f.kategori&&o.kategori!==f.kategori) continue;
if(f.tahun&&String(o.tahun)!==String(f.tahun)) continue;
if(q&&(o.judul+' '+o.file_name+' '+o.nomor+' '+o.tags+' '+o.deskripsi+' '+o.skpd+' '+o.jenis+' '+o.kategori).toLowerCase().indexOf(q)===-1) continue;
out.push(o); }
var sort=f.sort||'newest';
out.sort(function(a,b){
if(sort==='oldest') return a.rowIndex-b.rowIndex;
if(sort==='title') return a.judul.localeCompare(b.judul);
if(sort==='popular') return b.download_count-a.download_count;
if(sort==='year') return String(b.tahun).localeCompare(String(a.tahun))||b.rowIndex-a.rowIndex;
return b.rowIndex-a.rowIndex; });
return out;
}catch(e){ Logger.log('getBankData: '+e); return []; }
}

function saveBankData(obj,actorNip){
try{
var u=assertRole(actorNip,['Superadmin','TeamInternal']);
if(!obj||!obj.judul) return {success:false,message:'Judul dokumen wajib diisi.'};
if(!obj.file_id&&!obj.id) return {success:false,message:'File dokumen belum diunggah.'};
var s=setupBankDataSheet(), id=obj.id||('BD-'+Utilities.getUuid().substring(0,8).toUpperCase()), rowIdx=-1, old=null;
if(s.getLastRow()>1){ var d=s.getRange(2,1,s.getLastRow()-1,20).getValues();
for(var i=0;i<d.length;i++) if(String(d[i][0])===String(id)){ rowIdx=i+2; old=d[i]; break; } }
if(old&&u.role!=='Superadmin'&&String(old[15]||'')!==u.nip) return {success:false,message:'Hanya pengunggah atau Superadmin yang dapat mengubah dokumen ini.'};
var row=[id,String(obj.judul).trim(),String(obj.jenis||'Lainnya'),String(obj.nomor||''),String(obj.tahun||new Date().getFullYear()),
obj.tanggal||'',String(obj.kategori||'Umum'),String(obj.skpd||'-'),String(obj.tags||''),String(obj.deskripsi||''),'Final',
obj.file_id||(old?String(old[11]||''):''),
obj.file_name||(old?String(old[12]||''):''),
obj.file_type||(old?String(old[13]||''):''),
Number(obj.file_size||(old?old[14]:0)),
old?String(old[15]||''):u.nip,
old?String(old[16]||''):u.nama,
old?old[17]:new Date(),
old?Number(old[18]||0):0,
new Date()];
if(rowIdx>0) s.getRange(rowIdx,1,1,20).setValues([row]); else s.appendRow(row);
writeLog(actorNip,'Bank Data',rowIdx>0?'Edit':'Tambah',id,row[1]+' • '+row[2]);
return {success:true,id:id,message:'Dokumen "'+row[1]+'" berhasil '+(rowIdx>0?'diperbarui':'disimpan')+'.'};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

function deleteBankData(id,actorNip){
try{
var u=assertRole(actorNip,['Superadmin','TeamInternal']);
var s=setupBankDataSheet(); if(s.getLastRow()<2) return {success:false,message:'Data kosong.'};
var d=s.getRange(2,1,s.getLastRow()-1,20).getValues();
for(var i=0;i<d.length;i++) if(String(d[i][0])===String(id)){
if(u.role!=='Superadmin'&&String(d[i][15]||'')!==u.nip) return {success:false,message:'Hanya pengunggah atau Superadmin yang dapat menghapus.'};
try{ if(d[i][11]) DriveApp.getFileById(String(d[i][11])).setTrashed(true); }catch(e){}
s.deleteRow(i+2); writeLog(actorNip,'Bank Data','Hapus',id,String(d[i][1]));
return {success:true,message:'Dokumen berhasil dihapus beserta file-nya.'}; }
return {success:false,message:'Dokumen tidak ditemukan.'};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

function countBankDownload(id,actorNip){
try{ assertRole(actorNip,['Superadmin','TeamInternal']);
var s=setupBankDataSheet(); if(s.getLastRow()<2) return {success:true};
var d=s.getRange(2,1,s.getLastRow()-1,20).getValues();
for(var i=0;i<d.length;i++) if(String(d[i][0])===String(id)){
s.getRange(i+2,19).setValue(Number(d[i][18]||0)+1);
writeLog(actorNip,'Bank Data','Download',id,String(d[i][1])); return {success:true}; }
return {success:true};
}catch(e){ return {success:false}; }
}

function readSignaturesMap(){
var s=setupTTDSheet(), map={};
if(s.getLastRow()<2) return map;
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
for(var i=0;i<d.length;i++){
var id=String(d[i][4]||''); if(!id) continue;
if(!map[id]) map[id]=[];
map[id].push(sigObj(d[i],i+2)); }
return map;
}

function findSignatureByToken(token){
var s=setupTTDSheet(); if(s.getLastRow()<2) return null;
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues(), t=String(token||'').trim().toUpperCase();
for(var i=0;i<d.length;i++) if(String(d[i][1]).toUpperCase()===t) return sigObj(d[i],i+2);
return null;
}

function activateSignatures(tokens,fileId,actorNip){
var s=setupTTDSheet(); if(s.getLastRow()<2) return;
var set={}; for(var i=0;i<tokens.length;i++) set[String(tokens[i]).toUpperCase()]=true;
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
for(var j=0;j<d.length;j++) if(set[String(d[j][1]).toUpperCase()]) s.getRange(j+2,18,1,2).setValues([['AKTIF',fileId]]);
}

function retireSignatures(idDok,peran,keepTokens){
var s=setupTTDSheet(); if(s.getLastRow()<2) return;
var keep={}; for(var i=0;i<keepTokens.length;i++) keep[String(keepTokens[i]).toUpperCase()]=true;
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
for(var j=0;j<d.length;j++){
if(String(d[j][4])!==String(idDok)) continue;
if(peran&&String(d[j][8])!==peran) continue;
if(keep[String(d[j][1]).toUpperCase()]) continue;
if(String(d[j][17])==='DICABUT') continue;
s.getRange(j+2,18).setValue('DICABUT'); }
}

function revokeSignature(token,actorNip){
try{
assertRole(actorNip,['Superadmin']);
var s=setupTTDSheet(); if(s.getLastRow()<2) return {success:false,message:'Belum ada tanda tangan.'};
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
for(var j=0;j<d.length;j++) if(String(d[j][1]).toUpperCase()===String(token).toUpperCase()){
s.getRange(j+2,18).setValue('DICABUT');
writeLog(actorNip,'TPP','Cabut Tanda Tangan Elektronik',String(d[j][4]),String(d[j][6])+' • '+String(d[j][10])+' • token '+token);
return {success:true,message:'Tanda tangan elektronik '+token+' dicabut.'}; }
return {success:false,message:'Token tidak ditemukan.'};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

function qrFallbackText(o){
return ['TANDA TANGAN ELEKTRONIK KENDALI','Dokumen: '+o.nomor,'SKPD: '+o.skpd,'Periode: '+o.periode,
'Peran: '+o.peranLabel,'Nama: '+o.nama,'Pangkat/Golongan: '+o.pangkat,'NIP: '+o.nip,'Jabatan: '+o.jabatan,
'Ditandatangani: '+o.tglPanjang+' pukul '+o.jam+' WIB','Kode: '+o.token,'Sidik digital: '+String(o.hash||'').substring(0,32)].join(NL);
}

function tampilkanPICMapping(){
var map=SKPD_PIC_MAP(), byPic={}, lines=['=== PEMBAGIAN WILAYAH PIC ===',''], no=1;
for(var i=0;i<map.length;i++){
if(!byPic[map[i].pic_nip]) byPic[map[i].pic_nip]={nama:map[i].pic_nama,list:[]};
byPic[map[i].pic_nip].list.push(map[i].skpd); }
for(var k in byPic){
lines.push(no+'. '+byPic[k].nama+' ('+k+')');
for(var j=0;j<byPic[k].list.length;j++) lines.push('   '+(j+1)+'. '+byPic[k].list[j]);
lines.push(''); no++; }
lines.push('Total: '+map.length+' SKPD');
var hasil=lines.join(NL); Logger.log(hasil); return hasil;
}

function updatePICDanSinkron(){
try{
var sh=findUserSheet(); if(!sh) return 'ERROR: Sheet Data_Users tidak ditemukan.';
var m=getUserSheetMap(sh);
if(m.opd<0) return 'ERROR: Kolom OPD tidak terdeteksi pada sheet '+m.sheetName+'.';
var byPic={}, map=SKPD_PIC_MAP();
for(var i=0;i<map.length;i++){
if(!byPic[map[i].pic_nip]) byPic[map[i].pic_nip]={nama:map[i].pic_nama,list:[]};
byPic[map[i].pic_nip].list.push(map[i].skpd); }
var last=sh.getLastRow(); if(last<2) return 'ERROR: Sheet Data_Users kosong.';
var d=sh.getRange(2,1,last-1,m.lastCol).getValues(), ch=0, detail=[];
for(var j=0;j<d.length;j++){
var nip=String(d[j][m.nip]||'').trim(), nama=String(d[j][m.nama]||'').trim();
if(normalizeRole(d[j][m.role])!=='TeamInternal') continue;
var rn=resolvePICNip(nip,nama), info=rn?byPic[rn]:null;
if(!info){ detail.push('LEWATI: '+nip+' ('+nama+') tidak cocok dengan PIC mana pun'); continue; }
var oldVal=String(d[j][m.opd]||'').trim(), newVal=info.list.join('; ');
if(oldVal===newVal){ detail.push('SAMA: '+info.nama); continue; }
sh.getRange(j+2,m.opd+1).setValue(newVal); ch++;
detail.push('UPDATE: '+info.nama+' → '+newVal); }
try{ setupSKPDSheet(); detail.push('Sheet Data_SKPD disinkronkan ulang.'); }catch(e){ detail.push('Peringatan Data_SKPD: '+e.message); }
var hasil=['=== SINKRONISASI SELESAI ===','Akun diperbarui: '+ch,''].concat(detail).join(NL);
Logger.log(hasil); return hasil;
}catch(e){ Logger.log('ERROR: '+e.message); return 'ERROR: '+e.message; }
}

function generatePemberitahuanTPP(bulan,tahun,actorNip){
try{
var u=findUserRow(actorNip);
if(!u) return {success:false,message:'Sesi tidak valid. Silakan login ulang.'};
if(u.role!=='Superadmin'&&u.role!=='TeamInternal')
return {success:false,message:'Akses ditolak. Fitur ini khusus Team Internal & Superadmin.'};
var bl=Number(bulan), th=Number(tahun);
if(!bl||bl<1||bl>12||!th) return {success:false,message:'Bulan/Tahun tidak valid.'};
var namaBulan=BULAN_ID[bl-1], skpdList=getSkpdForActor(actorNip);
if(!skpdList.length&&u.role!=='Superadmin')
return {success:false,message:'Tidak ada SKPD yang terhubung dengan akun ini.'};
var pa=getPeriodeAktif(), linkApp='https://s.id/siKENDALI';
var L=['═══════════════════════════════','📢 *PEMBERITAHUAN AWAL BULAN*','*Persetujuan TPP & e-Kinerja*','═══════════════════════════════',''];
if(u.role==='Superadmin'){ L.push('Kepada Yth. Seluruh Admin TPP OPD di Lingkungan Pemerintah Kabupaten Banyuwangi,'); }
else { L.push('Kepada Yth. Bapak/Ibu Admin TPP pada OPD berikut:');
for(var i=0;i<skpdList.length;i++) L.push('• '+skpdList[i]); }
L.push('');
L.push('Bersama ini kami sampaikan hal yang perlu ditindaklanjuti pada bulan *'+namaBulan+' '+th+'*:');
L.push('');
L.push('*1️⃣ PENGISIAN e-KINERJA*');
L.push('Mohon mengingatkan seluruh pegawai pada OPD masing-masing untuk mengisi e-Kinerja (rencana & capaian kinerja bulanan):');
L.push('📅 Tanggal 1 s.d. paling lambat *tanggal 7, bulan penialian*');
L.push('⚠️ Keterlambatan pengisian berdampak pada penilaian kinerja pegawai.');
L.push('');
L.push('*2️⃣ PERSETUJUAN TPP di KENDALI*');
L.push('Mohon Bapak/Ibu Admin TPP melakukan:');
L.push('✅ Login ke '+linkApp);
L.push('✅ Buka menu *Persetujuan TPP → Isi Persetujuan*');
L.push('✅ Centang konfirmasi tanggal 7 & tanggal 10 (periode aktif saat ini: '+pa.label+')');
L.push('✅ Buat & cetak Draft Berita Acara, tandatangani oleh Kepala OPD & bubuhkan stempel');
L.push('✅ Unggah kembali Berita Acara yang telah ditandatangani ke aplikasi');
L.push('');
L.push('*🔐 KREDENSIAL LOGIN:*');
L.push('🔗 '+linkApp);
L.push('👤 NIP / ID User: sesuai data yang telah diberikan');
L.push('🔑 Password: sesuai data yang telah diberikan');
L.push('');
L.push('*📞 Dukungan Teknis:*');
L.push('Bila ada kendala teknis atau lupa password, hubungi PIC Pendamping wilayah masing-masing atau Tim KENDALI Bagian Organisasi.');
L.push('');
L.push('─────────────────────────────');
L.push('Hormat kami,');
L.push('*'+u.nama+'*');
L.push('Tim KENDALI — Bagian Organisasi');
L.push('Setda Kabupaten Banyuwangi');
L.push('─────────────────────────────');
var pesan=L.join(NL);
writeLog(actorNip,'TPP','Generate Pemberitahuan',namaBulan+' '+th,'Target: '+(u.role==='Superadmin'?'seluruh OPD':skpdList.length+' SKPD'));
return {success:true,pesan:pesan,bulanNama:namaBulan,tahun:th,
jumlahSKPD:u.role==='Superadmin'?OPD_LIST().length:skpdList.length,dikirimOleh:u.nama,linkApp:linkApp};
}catch(e){ Logger.log('generatePemberitahuanTPP: '+e); return {success:false,message:'Error: '+e.message}; }
}


//============================================
// KONTAK DUKUNGAN DINAMIS (sesuai OPD yang login)
//============================================
function getKontakDukunganTPP(actorNip){
  var out={judul:'E. Kontak Dukungan',icon:'📞',picList:[],kontak:[],catatan:''};
  var pegawai=[], bag=null, i;
  try{ pegawai=getPegawaiData(); }catch(e){}
  for(i=0;i<pegawai.length;i++){
    if(canon(pegawai[i].jabatan).indexOf('kepalabagianorganisasi')>-1){ bag=pegawai[i]; break; }
  }
  var kontakBag=[];
  if(bag){
    kontakBag.push(bag.nama+' — '+(bag.jabatan||'Kepala Bagian Organisasi'));
    if(bag.email) kontakBag.push('Email: '+bag.email);
  }
  kontakBag.push('Bagian Organisasi Sekretariat Daerah Kabupaten Banyuwangi');
  kontakBag.push('Jl. Jenderal Ahmad Yani No. 100, Banyuwangi');
  kontakBag.push('Telepon: 0333-425001');
  out.kontak=kontakBag;
  try{
    var u=actorNip?findUserRow(actorNip):null;
    if(!u){
      out.catatan='Login terlebih dahulu untuk melihat nama PIC pendamping OPD Anda.';
      out.picList=[];
      return out;
    }
    var mine=getSkpdForActor(actorNip), byPic={}, order=[];
    for(var j=0;j<mine.length;j++){
      var info=getPICForSkpd(mine[j]);
      var key=info.pic_nip||canon(info.pic_nama);
      if(!key) continue;
      if(!byPic[key]){
        var pgm=null, cn=canon(info.pic_nama);
        for(var k=0;k<pegawai.length;k++) if(canon(pegawai[k].nama)===cn){ pgm=pegawai[k]; break; }
        byPic[key]={
          nama:info.pic_nama,
          nip:pgm?pgm.nip:info.pic_nip,
          jabatan:pgm?(pgm.jabatan||'PIC Pendamping'):'PIC Pendamping Bagian Organisasi',
          pangkat:pgm?pgm.pangkat:'',
          email:pgm?pgm.email:'',
          skpd:[]
        };
        order.push(key);
      }
      byPic[key].skpd.push(mine[j]);
    }
    for(var m=0;m<order.length;m++) out.picList.push(byPic[order[m]]);
    if(u.role==='UserOPD'){
      out.catatan='PIC pendamping di bawah adalah rujukan pertama bila OPD Anda mengalami kendala teknis, lupa password, atau perlu pembukaan kunci periode.';
    } else if(u.role==='TeamInternal'){
      out.catatan='Anda adalah PIC Pendamping untuk '+mine.length+' SKPD listed di atas. Bila kendala berada di luar kewenangan Anda, eskalasi ke Bagian Organisasi.';
    } else {
      out.catatan='Seluruh PIC Pendamping Bagian Organisasi beserta wilayah binaannya.';
    }
  }catch(e){
    out.catatan='Data PIC belum dapat dibaca: '+e.message;
  }
  return out;
}




//============================================
// KARTU KEPATUHAN SKPD (Dashboard Superadmin / PIC)
//============================================
function getComplianceCard(year,actorNip){
try{
var u=findUserRow(actorNip);
if(!u) return {success:false,message:'Sesi tidak valid. Silakan login ulang.'};
if(u.role==='UserOPD') return {success:false,message:'Fitur ini untuk Tim Internal & Superadmin.'};
var cfg=getTPPConfig(), pa=getPeriodeAktif();
var yr=Number(year)||pa.tahun;
var mine=getSkpdForActor(actorNip);
if(!mine.length) return {success:false,message:'Tidak ada SKPD yang terhubung dengan akun ini.'};

var s=setupTPPSheets(), rec={};
if(s.getLastRow()>1){
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
for(var i=0;i<d.length;i++){
var k=canon(d[i][1])+'|'+String(d[i][3])+'|'+Number(d[i][4]);
rec[k]={status:String(d[i][13]||'Belum'),ba:String(d[i][15]||''),fin:String(d[i][21]||''),
tgl7:String(d[i][5])==='YA',tgl10:String(d[i][9])==='YA'};
}
}

var prof={}, ps=setupProfilOPD();
if(ps.getLastRow()>1){
var pd=ps.getRange(2,1,ps.getLastRow()-1,21).getValues();
for(var j=0;j<pd.length;j++){
prof[canon(pd[j][0])]=!!(String(pd[j][3]||'').trim()&&String(pd[j][4]||'').trim()&&String(pd[j][5]||'').trim()&&
String(pd[j][11]||'').trim()&&String(pd[j][12]||'').trim()&&String(pd[j][13]||'').trim());
}
}

var a={lengkap:0,sebagian:0,belum:0,draft:0,final:0,no7:0,no10:0};
var profilKosong=[], perhatian=[], tunggakan=0, tunggakanList=[], perPic={};

for(var m=0;m<mine.length;m++){
var sk=mine[m], info=getPICForSkpd(sk), pn=info.pic_nama||'Tanpa PIC';
if(!perPic[pn]) perPic[pn]={pic_nama:pn,total:0,lengkap:0,final:0};
perPic[pn].total++;

var ka=canon(sk)+'|'+pa.tahun+'|'+pa.bulan;
var ra=rec[ka]||{status:'Belum',ba:'',fin:'',tgl7:false,tgl10:false};
if(ra.status==='Lengkap'){ a.lengkap++; perPic[pn].lengkap++; }
else if(ra.status==='Sebagian') a.sebagian++;
else a.belum++;
if(ra.ba) a.draft++;
if(ra.fin){ a.final++; perPic[pn].final++; }
if(!ra.tgl7) a.no7++;
if(!ra.tgl10) a.no10++;

if(!prof[canon(sk)]){
profilKosong.push({skpd:sk,pic_nama:pn});
perhatian.push({skpd:sk,pic_nama:pn,tipe:'profil',bulan:pa.bulan,tahun:pa.tahun,
masalah:'Profil penanda tangan belum lengkap — belum bisa membuat Berita Acara'});
}
if(ra.status!=='Lengkap'){
perhatian.push({skpd:sk,pic_nama:pn,tipe:'konfirmasi',bulan:pa.bulan,tahun:pa.tahun,
masalah:'Konfirmasi '+pa.label+' masih '+ra.status+(ra.tgl7?' (tanggal 7 sudah)':' (tanggal 7 & 10 belum)')});
} else if(ra.ba&&!ra.fin){
perhatian.push({skpd:sk,pic_nama:pn,tipe:'final',bulan:pa.bulan,tahun:pa.tahun,
masalah:'Draft BA '+pa.label+' sudah dibuat, dokumen bertanda tangan belum diunggah'});
}

for(var b=1;b<=pa.bulan;b++){
var kb=canon(sk)+'|'+pa.tahun+'|'+b;
var rb=rec[kb]||{status:'Belum',ba:'',fin:''};
if(rb.status!=='Lengkap'||(rb.ba&&!rb.fin)){
tunggakan++;
if(tunggakanList.length<25) tunggakanList.push({skpd:sk,pic_nama:pn,bulan:b,bulanNama:BULAN_ID[b-1],
tahun:pa.tahun,status:rb.status,final:!!rb.fin});
}
}
}

var total=mine.length, picArr=[];
for(var pk in perPic) picArr.push(perPic[pk]);
picArr.sort(function(x,y){ return (y.lengkap/y.total)-(x.lengkap/x.total)||String(x.pic_nama).localeCompare(String(y.pic_nama)); });

var urutan={profil:0,konfirmasi:1,final:2};
perhatian.sort(function(x,y){ return (urutan[x.tipe]||9)-(urutan[y.tipe]||9)||String(x.skpd).localeCompare(String(y.skpd)); });

return {success:true,periode:pa,tahunTampilan:yr,total:total,aktif:a,
persenLengkap:total?Math.round(a.lengkap/total*100):0,
persenDraft:total?Math.round(a.draft/total*100):0,
persenFinal:total?Math.round(a.final/total*100):0,
profilKosongCount:profilKosong.length,profilKosong:profilKosong.slice(0,20),
perhatianCount:perhatian.length,perhatian:perhatian.slice(0,12),
tunggakanCount:tunggakan,tunggakan:tunggakanList,
perPic:picArr,isSuper:u.role==='Superadmin',nama:u.nama};
}catch(e){ Logger.log('getComplianceCard: '+e); return {success:false,message:'Error: '+e.message}; }
}


//============================================
// BLOK FINAL v17 — PIC LIVE • FINAL OTOMATIS • PEMBERITAHUAN
//============================================
var NLK=String.fromCharCode(10);

function picOfSkpd(skpd){
var c=canon(skpd), map=SKPD_PIC_MAP(), i;
for(i=0;i<map.length;i++) if(canon(map[i].skpd)===c) return {pic_nip:map[i].pic_nip,pic_nama:map[i].pic_nama};
var list=OPD_LIST(), target='';
for(i=0;i<list.length;i++) if(canon(list[i])===c){ target=list[i]; break; }
if(!target) for(i=0;i<list.length;i++){ var k=canon(list[i]); if(k.indexOf(c)>-1||c.indexOf(k)>-1){ target=list[i]; break; } }
if(target){ var ct=canon(target); for(i=0;i<map.length;i++) if(canon(map[i].skpd)===ct) return {pic_nip:map[i].pic_nip,pic_nama:map[i].pic_nama}; }
return {pic_nip:'',pic_nama:'-'};
}
function getPICForSkpd(skpd){
var p=picOfSkpd(skpd);
return {skpd:skpd,pic_nip:p.pic_nip,pic_nama:p.pic_nama,jenis:jenisSkpd(skpd),kode:kodeSkpd(skpd)};
}

function readSignaturesMap(){
var s=setupTTDSheet(), map={};
if(s.getLastRow()<2) return map;
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
for(var i=0;i<d.length;i++){ var id=String(d[i][4]||''); if(!id) continue;
if(!map[id]) map[id]=[]; map[id].push(sigObj(d[i],i+2)); }
return map;
}
function findSignatureByToken(token){
var s=setupTTDSheet(); if(s.getLastRow()<2) return null;
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues(), t=String(token||'').trim().toUpperCase();
for(var i=0;i<d.length;i++) if(String(d[i][1]).toUpperCase()===t) return sigObj(d[i],i+2);
return null;
}
function activateSignatures(tokens,fileId,actorNip){
var s=setupTTDSheet(); if(s.getLastRow()<2) return;
var set={}; for(var i=0;i<tokens.length;i++) set[String(tokens[i]).toUpperCase()]=true;
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
for(var j=0;j<d.length;j++) if(set[String(d[j][1]).toUpperCase()]) s.getRange(j+2,18,1,2).setValues([['AKTIF',fileId]]);
}
function retireSignatures(idDok,peran,keepTokens){
var s=setupTTDSheet(); if(s.getLastRow()<2) return;
var keep={}; for(var i=0;i<keepTokens.length;i++) keep[String(keepTokens[i]).toUpperCase()]=true;
var d=s.getRange(2,1,s.getLastRow()-1,21).getValues();
for(var j=0;j<d.length;j++){
if(String(d[j][4])!==String(idDok)) continue;
if(peran&&String(d[j][8])!==peran) continue;
if(keep[String(d[j][1]).toUpperCase()]) continue;
if(String(d[j][17])==='DICABUT') continue;
s.getRange(j+2,18).setValue('DICABUT'); }
}

function baElektronikPenuh(rec){ return !!(rec&&rec.sig_admin&&rec.sig_kepala); }
function baIsFinal(rec){ return !!(rec&&(rec.final_file_id||baElektronikPenuh(rec))); }
function baMetodeLabel(rec){
var a=!!(rec&&rec.sig_admin), k=!!(rec&&rec.sig_kepala);
if(a&&k) return 'ELEKTRONIK';
if(a||k) return 'CAMPURAN';
return 'MANUAL';
}

function readTPP(year,cfg){
var s=setupTPPSheets(), map={}, lock=String(cfg.KUNCI_SETERAH_BA||'YA').toUpperCase()==='YA', sigMap=readSignaturesMap();
if(s.getLastRow()<2) return map;
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
for(var i=0;i<d.length;i++){
if(String(d[i][3])!==String(year)) continue;
var id=String(d[i][0]), skpd=String(d[i][1]), live=picOfSkpd(skpd);
var sg=sigMap[id]||[], sa=null, sk2=null;
for(var q=0;q<sg.length;q++){ if(sg[q].status==='DICABUT') continue;
if(sg[q].peran==='ADMIN') sa=sg[q]; else if(sg[q].peran==='KEPALA') sk2=sg[q]; }
var p7=dtParts(d[i][6]), p10=dtParts(d[i][10]), fin=String(d[i][21]||'');
var rec={id:id,skpd:skpd,kode:String(d[i][2]),tahun:String(d[i][3]),bulan:Number(d[i][4]),
tgl7:String(d[i][5])==='YA',tgl7_waktu:fmtDT(d[i][6]),tgl7_tgl:p7.tgl,tgl7_jam:p7.jam,tgl7_oleh:String(d[i][8]||''),tgl7_nip:String(d[i][7]||''),
tgl10:String(d[i][9])==='YA',tgl10_waktu:fmtDT(d[i][10]),tgl10_tgl:p10.tgl,tgl10_jam:p10.jam,tgl10_oleh:String(d[i][12]||''),tgl10_nip:String(d[i][11]||''),
status:String(d[i][13]||'Belum'),ba_nomor:String(d[i][14]||''),ba_file_id:String(d[i][15]||''),ba_waktu:fmtDT(d[i][16]),ba_oleh:String(d[i][17]||''),
pic_nip:live.pic_nip,pic_nama:live.pic_nama,
final_file_id:fin,final_name:String(d[i][22]||''),final_type:String(d[i][23]||''),final_size:Number(d[i][24]||0),
final_upload:fmtDT(d[i][25]),final_by:String(d[i][26]||''),
sig_admin:sa,sig_kepala:sk2,signatures:sg,rowIndex:i+2};
rec.elektronik_penuh=!!(sa&&sk2);
rec.is_final=!!(fin||rec.elektronik_penuh);
rec.final_mode=fin?'UNGGAH':(rec.elektronik_penuh?'ELEKTRONIK':'');
rec.metode=baMetodeLabel(rec);
rec.locked=!!(rec.ba_file_id&&lock);
map[tppKey(skpd,d[i][3],d[i][4])]=rec; }
return map;
}

function emptyTPPRec(skpd,yr,b,info){
var live=picOfSkpd(skpd);
return {id:'',skpd:skpd,kode:(info&&info.kode)||kodeSkpd(skpd),tahun:String(yr),bulan:b,
tgl7:false,tgl7_waktu:'',tgl7_tgl:'',tgl7_jam:'',tgl7_oleh:'',
tgl10:false,tgl10_waktu:'',tgl10_tgl:'',tgl10_jam:'',tgl10_oleh:'',
status:'Belum',ba_nomor:'',ba_file_id:'',ba_waktu:'',ba_oleh:'',
pic_nip:live.pic_nip,pic_nama:live.pic_nama,
final_file_id:'',final_name:'',final_type:'',final_size:0,final_upload:'',final_by:'',
sig_admin:null,sig_kepala:null,signatures:[],
elektronik_penuh:false,is_final:false,final_mode:'',metode:'MANUAL',locked:false};
}

function getTPPMatrix(year,actorNip){
try{
var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.',rows:[]};
var yr=Number(year)||new Date().getFullYear(), cfg=getTPPConfig(), pa=getPeriodeAktif(), now=new Date();
var mine=getSkpdForActor(actorNip), map=readTPP(yr,cfg), rows=[], prof={};
var ps=setupProfilOPD();
if(ps.getLastRow()>1){ var pd=ps.getRange(2,1,ps.getLastRow()-1,21).getValues(); for(var p=0;p<pd.length;p++) prof[canon(pd[p][0])]=profilObj(pd[p],false); }
for(var i=0;i<mine.length;i++){
var sk=mine[i], info=getPICForSkpd(sk), months=[];
for(var b=1;b<=12;b++){
var rec=map[tppKey(sk,yr,b)]||emptyTPPRec(sk,yr,b,info);
rec.eligible=periodeLE(yr,b,pa.tahun,pa.bulan)||String(cfg.KUNCI_PERIODE||'YA').toUpperCase()!=='YA';
rec.isAktif=(yr===pa.tahun&&b===pa.bulan);
rec.win7=windowOpen(yr,b,'7',cfg,now); rec.win10=windowOpen(yr,b,'10',cfg,now);
months.push(rec); }
var lg=0,sb=0,ba2=0,fn2=0;
for(var j=0;j<months.length;j++){ if(months[j].status==='Lengkap')lg++; else if(months[j].status==='Sebagian')sb++;
if(months[j].ba_file_id)ba2++; if(months[j].is_final)fn2++; }
rows.push({skpd:sk,kode:info.kode,jenis:info.jenis,pic_nip:info.pic_nip,pic_nama:info.pic_nama,months:months,
lengkap:lg,sebagian:sb,belum:12-lg-sb,ba_count:ba2,final_count:fn2,progress:Math.round(lg/12*100),
profil:prof[canon(sk)]||{skpd:sk,admin:{jabatan:defaultJabatanAdmin(sk),nama:'',nip:'',pangkat:'',ttd_file_id:'',metode:normMetode(cfg.METODE_TTD_DEFAULT)},kepala:{jabatan:defaultJabatanKepala(sk),nama:'',nip:'',pangkat:'',ttd_file_id:'',metode:normMetode(cfg.METODE_TTD_DEFAULT),has_pin:false},lengkap:false}}); }
rows.sort(function(a,b){ return a.skpd.localeCompare(b.skpd); });
var pics={}, plist=[];
for(var x=0;x<rows.length;x++){ var kk=rows[x].pic_nip||'-';
if(!pics[kk]){ pics[kk]=true; plist.push({nip:kk,nama:rows[x].pic_nama||'Tanpa PIC'}); } }
plist.sort(function(a,b){ return a.nama.localeCompare(b.nama); });
return {success:true,year:yr,role:u.role,nama:u.nama,rows:rows,config:cfg,periodeAktif:pa,picList:plist,bulanNama:BULAN_ID,bulanShort:BULAN_SHORT};
}catch(e){ return {success:false,message:'Error: '+e.message,rows:[]}; }
}

function getTPPStats(year,actorNip){
var r=getTPPMatrix(year,actorNip), s={skpd:0,lengkap:0,sebagian:0,belum:0,ba:0,final:0,slotTotal:0,slotIsi:0,picCount:0,terkunci:0};
if(!r.success) return s;
var pics={};
for(var i=0;i<r.rows.length;i++){ var row=r.rows[i];
s.skpd++; s.lengkap+=row.lengkap; s.sebagian+=row.sebagian; s.belum+=row.belum; s.ba+=row.ba_count; s.final+=row.final_count; s.slotTotal+=24;
for(var j=0;j<row.months.length;j++){ if(row.months[j].tgl7)s.slotIsi++; if(row.months[j].tgl10)s.slotIsi++; if(row.months[j].locked)s.terkunci++; }
if(row.pic_nip) pics[row.pic_nip]=true; }
s.picCount=Object.keys(pics).length; s.persenSlot=s.slotTotal?Math.round(s.slotIsi/s.slotTotal*100):0;
return s;
}

function getTPPMonitorByPIC(year,actorNip){
try{ assertRole(actorNip,['Superadmin']);
var r=getTPPMatrix(year,actorNip), by={};
for(var i=0;i<r.rows.length;i++){ var row=r.rows[i], k=row.pic_nip||'-';
if(!by[k]) by[k]={pic_nip:k,pic_nama:row.pic_nama||'Tanpa PIC',skpd:0,lengkap:0,sebagian:0,belum:0,ba:0,final:0};
by[k].skpd++; by[k].lengkap+=row.lengkap; by[k].sebagian+=row.sebagian; by[k].belum+=row.belum; by[k].ba+=row.ba_count; by[k].final+=row.final_count; }
var out=[]; for(var x in by) out.push(by[x]);
out.sort(function(a,b){ return b.lengkap-a.lengkap; }); return out;
}catch(e){ return []; }
}

function getBeritaAcaraList(year,actorNip){
try{
var u=findUserRow(actorNip); if(!u) return [];
var mine=getSkpdForActor(actorNip), set={}; for(var i=0;i<mine.length;i++) set[canon(mine[i])]=true;
var s=setupTPPSheets(); if(s.getLastRow()<2) return [];
var cfg=getTPPConfig(), map=readTPP(Number(year),cfg);
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues(), out=[];
for(var j=0;j<d.length;j++){
if(String(d[j][3])!==String(year)||!String(d[j][15]||'')) continue;
var skpd=String(d[j][1]); if(!set[canon(skpd)]) continue;
var live=picOfSkpd(skpd), id=String(d[j][0]), bl=Number(d[j][4]);
var rec=map[tppKey(skpd,year,bl)]||emptyTPPRec(skpd,Number(year),bl,{kode:String(d[j][2])});
var fid=String(d[j][15]);
out.push({id:id,skpd:skpd,bulan:bl,bulanNama:BULAN_ID[bl-1],tahun:String(d[j][3]),
nomor:String(d[j][14]),file_id:fid,pic_nip:live.pic_nip,pic_nama:live.pic_nama,
dibuat:fmtDT(d[j][16]),oleh:String(d[j][17]||''),
final_file_id:rec.final_file_id,final_name:rec.final_name,final_size:rec.final_size,final_upload:rec.final_upload,final_by:rec.final_by,
sig_admin:rec.sig_admin,sig_kepala:rec.sig_kepala,
elektronik_penuh:rec.elektronik_penuh,is_final:rec.is_final,final_mode:rec.final_mode,metode:rec.metode,
wajib_unggah:!rec.elektronik_penuh,canUpload:u.role!=='TeamInternal'&&!rec.elektronik_penuh,
previewUrl:drivePreviewSrv_(fid),viewUrl:driveViewSrv_(fid),downloadUrl:driveDownloadSrv_(fid)}); }
out.sort(function(a,b){ return a.skpd.localeCompare(b.skpd)||a.bulan-b.bulan; });
return out;
}catch(e){ return []; }
}
function drivePreviewSrv_(id){ return 'https://drive.google.com/file/d/'+id+'/preview'; }
function driveViewSrv_(id){ return 'https://drive.google.com/file/d/'+id+'/view'; }
function driveDownloadSrv_(id){ return 'https://drive.google.com/uc?export=download&id='+id; }

function prepareBeritaAcara(skpd,year,month,opts,actorNip){
try{
var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
if(u.role==='TeamInternal') return {success:false,message:'Pembuatan Berita Acara dilakukan oleh admin OPD yang bersangkutan.'};
if(!ownsSkpd(actorNip,skpd)) return {success:false,message:'Anda tidak berwenang membuat Berita Acara untuk SKPD ini.'};
var cfg=getTPPConfig(), map=readTPP(Number(year),cfg), rec=map[tppKey(skpd,year,month)];
if(!rec||rec.status!=='Lengkap') return {success:false,message:'Berita Acara hanya dapat dibuat jika konfirmasi tanggal 7 dan 10 sudah lengkap.'};
if(rec.elektronik_penuh) return {success:false,message:'Berita Acara periode ini sudah FINAL dengan tanda tangan elektronik lengkap. Tidak dapat dibuat ulang. Hubungi Bagian Organisasi bila perlu perubahan.'};
if(rec.final_file_id) return {success:false,message:'Berita Acara bertanda tangan sudah diunggah untuk periode ini. Hapus unggahan tersebut terlebih dahulu atau hubungi Bagian Organisasi.'};
if(rec.ba_file_id&&String(cfg.IZINKAN_CETAK_ULANG_BA||'YA').toUpperCase()!=='YA')
return {success:false,message:'Berita Acara periode ini sudah dibuat dan pencetakan ulang dinonaktifkan.'};
var pr=readProfilRow(skpd); if(!pr) return {success:false,message:'Profil OPD belum tersedia.'};
var p=profilObj(pr.data,true);
if(!p.admin.nama||!p.admin.nip||!p.admin.pangkat) return {success:false,needProfil:true,message:'Lengkapi dahulu Nama, NIP, dan Pangkat/Golongan Pengelola Admin pada menu Profil OPD & TTD.'};
if(!p.kepala.nama||!p.kepala.nip||!p.kepala.pangkat) return {success:false,needProfil:true,message:'Lengkapi dahulu Nama, NIP, dan Pangkat/Golongan Kepala OPD pada menu Profil OPD & TTD.'};
var o=opts||{};
var mA=normMetode(o.adminMetode||p.admin.metode||cfg.METODE_TTD_DEFAULT);
var mK=normMetode(o.kepalaMetode||p.kepala.metode||cfg.METODE_TTD_DEFAULT);
if(String(cfg.WAJIB_TTD_ELEKTRONIK||'TIDAK').toUpperCase()==='YA'){ mA='ELEKTRONIK'; mK='ELEKTRONIK'; }
if(mK==='ELEKTRONIK'&&String(pr.data[18]||'')){
if(!String(o.kepalaPin||'')) return {success:false,needPin:true,message:'PIN persetujuan Kepala OPD diperlukan untuk tanda tangan elektronik.'};
if(pinHash(skpd,String(o.kepalaPin))!==String(pr.data[18])) return {success:false,needPin:true,message:'PIN persetujuan Kepala OPD salah.'};
}
var info=getPICForSkpd(skpd);
var nomor=rec.ba_nomor||(('000'+nextDocNumber('BA-TPP',year,true)).slice(-3)+'/BA-TPP/'+info.kode+'/'+ROMAWI[Number(month)-1]+'/'+year);
var periode=BULAN_ID[Number(month)-1]+' '+year;
p.admin.jabatan=p.admin.jabatan||defaultJabatanAdmin(skpd);
p.kepala.jabatan=p.kepala.jabatan||defaultJabatanKepala(skpd);
p.admin.metode=mA; p.kepala.metode=mK;
var sigA=null,sigK=null,tokens=[];
if(mA==='ELEKTRONIK'){ sigA=createSignature(rec,nomor,periode,'ADMIN',p.admin,u); tokens.push(sigA.token); }
if(mK==='ELEKTRONIK'){ sigK=createSignature(rec,nomor,periode,'KEPALA',p.kepala,u); tokens.push(sigK.token); }
return {success:true,nomor:nomor,record:rec,profil:p,kontak:getKontak(skpd),config:cfg,logo:getLogoKop(),
sigAdmin:sigA,sigKepala:sigK,tokens:tokens,akanFinal:(mA==='ELEKTRONIK'&&mK==='ELEKTRONIK'),
bulanNama:BULAN_ID[Number(month)-1],romawi:ROMAWI[Number(month)-1],pic_nama:info.pic_nama,reprint:!!rec.ba_file_id,appUrl:getWebAppUrl()};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

function registerBeritaAcara(skpd,year,month,base64,filename,nomor,tokens,actorNip){
try{
var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
if(!ownsSkpd(actorNip,skpd)) return {success:false,message:'Tidak berwenang.'};
var cfg=getTPPConfig(), s=setupTPPSheets(), map=readTPP(Number(year),cfg), rec=map[tppKey(skpd,year,month)];
if(!rec||rec.status!=='Lengkap') return {success:false,message:'Konfirmasi belum lengkap.'};
if(rec.elektronik_penuh) return {success:false,message:'Periode ini sudah final dengan tanda tangan elektronik lengkap.'};
if(rec.final_file_id) return {success:false,message:'BA bertanda tangan sudah diunggah. Draft tidak dapat dibuat ulang.'};
if(rec.ba_file_id&&String(cfg.IZINKAN_CETAK_ULANG_BA||'YA').toUpperCase()!=='YA') return {success:false,message:'Pencetakan ulang dinonaktifkan.'};
if(rec.ba_file_id){ try{ DriveApp.getFileById(rec.ba_file_id).setTrashed(true); }catch(e){} }
var file=getTPPFolder().createFile(Utilities.newBlob(Utilities.base64Decode(base64),'application/pdf',filename));
file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
var fid=file.getId(), info=getPICForSkpd(skpd);
var use=nomor||rec.ba_nomor||(('000'+nextDocNumber('BA-TPP',year,false)).slice(-3)+'/BA-TPP/'+info.kode+'/'+ROMAWI[Number(month)-1]+'/'+year);
var mm=String(use).match(/^(\d+)/); if(mm) setDocNumberAtLeast('BA-TPP',Number(year),parseInt(mm[1],10));
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
for(var j=0;j<d.length;j++) if(String(d[j][0])===rec.id){
s.getRange(j+2,15,1,4).setValues([[use,fid,new Date(),u.nama]]);
s.getRange(j+2,19,1,2).setValues([[info.pic_nip,info.pic_nama]]); break; }
var tk=tokens||[];
activateSignatures(tk,fid,actorNip);
retireSignatures(rec.id,'',tk);
var autoFinal=(tk.length>=2);
writeLog(actorNip,'TPP',rec.ba_file_id?'Cetak Ulang Berita Acara':'Buat Berita Acara',rec.id,
skpd+' • '+BULAN_ID[Number(month)-1]+' '+year+' • '+use+(autoFinal?' • FINAL elektronik':' • menunggu unggahan manual'));
return {success:true,nomor:use,file_id:fid,tokens:tk,is_final:autoFinal,final_mode:autoFinal?'ELEKTRONIK':'',
previewUrl:drivePreviewSrv_(fid),viewUrl:driveViewSrv_(fid),downloadUrl:driveDownloadSrv_(fid),
message:autoFinal
? 'Berita Acara '+use+' FINAL. Kedua penanda tangan memakai tanda tangan elektronik — tidak perlu unggah dokumen lagi.'
: 'Berita Acara '+use+' dibuat. Karena ada tanda tangan manual, cetak, tandatangani & stempel, lalu unggah kembali dokumen hasilnya.'};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

function uploadBeritaAcaraFinal(skpd,year,month,base64,filename,mimeType,actorNip){
try{
var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
if(u.role==='TeamInternal') return {success:false,message:'Pengunggahan dilakukan oleh admin OPD yang bersangkutan.'};
if(!ownsSkpd(actorNip,skpd)) return {success:false,message:'Anda tidak berwenang mengunggah untuk SKPD ini.'};
var cfg=getTPPConfig(), map=readTPP(Number(year),cfg), rec=map[tppKey(skpd,year,month)];
if(!rec||!rec.ba_file_id) return {success:false,message:'Buat draft Berita Acara terlebih dahulu.'};
if(rec.elektronik_penuh) return {success:false,message:'Tidak perlu unggah dokumen. Kedua penanda tangan memakai tanda tangan elektronik sehingga Berita Acara sudah final.'};
if(!base64) return {success:false,message:'File belum dipilih.'};
if(base64.length>15000000) return {success:false,message:'Ukuran file terlalu besar. Maksimal 10MB.'};
var okType=['application/pdf','image/jpeg','image/jpg','image/png'];
if(okType.indexOf(String(mimeType).toLowerCase())===-1) return {success:false,message:'Format harus PDF, JPG, atau PNG.'};
var s=setupTPPSheets(), old=rec.final_file_id;
var file=getBAFinalFolder().createFile(Utilities.newBlob(Utilities.base64Decode(base64),mimeType,filename));
file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
var fid=file.getId(), size=file.getSize();
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
for(var j=0;j<d.length;j++) if(String(d[j][0])===rec.id){ s.getRange(j+2,22,1,6).setValues([[fid,filename,mimeType,size,new Date(),u.nama]]); break; }
if(old){ try{ DriveApp.getFileById(old).setTrashed(true); }catch(e){} }
writeLog(actorNip,'TPP',old?'Ganti BA Bertanda Tangan':'Unggah BA Bertanda Tangan',rec.id,skpd+' • '+BULAN_ID[Number(month)-1]+' '+year+' • '+filename);
return {success:true,file_id:fid,file_name:filename,file_size:size,
previewUrl:drivePreviewSrv_(fid),viewUrl:driveViewSrv_(fid),downloadUrl:driveDownloadSrv_(fid),
message:'Berita Acara bertanda tangan & berstempel berhasil diunggah. Status periode ini menjadi FINAL.'};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

//============================================
// PEMBERITAHUAN — PERIODE KINERJA & BATAS 7 / 10
//============================================
function generatePemberitahuanTPP(bulan,tahun,actorNip){
try{
var u=findUserRow(actorNip);
if(!u) return {success:false,message:'Sesi tidak valid. Silakan login ulang.'};
if(u.role!=='Superadmin'&&u.role!=='TeamInternal')
return {success:false,message:'Akses ditolak. Fitur ini khusus Team Internal & Superadmin.'};
var bl=Number(bulan), th=Number(tahun);
if(!bl||bl<1||bl>12||!th) return {success:false,message:'Bulan/Tahun tidak valid.'};
var namaBulan=BULAN_ID[bl-1];
var pb=bl-1, pt=th; if(pb===0){ pb=12; pt=th-1; }
var periodeLabel=BULAN_ID[pb-1]+' '+pt;
var skpdList=getSkpdForActor(actorNip);
if(!skpdList.length&&u.role!=='Superadmin')
return {success:false,message:'Tidak ada SKPD yang terhubung dengan akun ini.'};
var linkApp='https://s.id/siKENDALI';
var batasInput='7 '+namaBulan+' '+th, batasSetuju='10 '+namaBulan+' '+th;
var picNama=u.role==='TeamInternal'?u.nama:'Tim KENDALI Bagian Organisasi';
var L=[];
L.push('═══════════════════════════════');
L.push('📢 *PEMBERITAHUAN AWAL BULAN*');
L.push('*Persetujuan Kinerja bulan '+periodeLabel+'*');
L.push('═══════════════════════════════');
L.push('');
if(u.role==='Superadmin'){ L.push('Kepada Yth. Seluruh Admin TPP OPD di Lingkungan Pemerintah Kabupaten Banyuwangi,'); }
else { L.push('Kepada Yth. Bapak/Ibu Admin TPP pada OPD berikut:');
for(var i=0;i<skpdList.length;i++) L.push('• '+skpdList[i]); }
L.push('');
L.push('Bersama ini kami sampaikan hal yang perlu ditindaklanjuti pada bulan *'+namaBulan+' '+th+'*:');
L.push('');
L.push('*1️⃣ INPUT REALISASI KINERJA*');
L.push('Mohon mengingatkan seluruh pegawai pada OPD masing-masing untuk mengisi realisasi kinerja bulan '+periodeLabel+'.');
L.push('📅 Batas waktu input realisasi kinerja: *paling lambat tanggal '+batasInput+'*');
L.push('⚠️ Keterlambatan pengisian berdampak pada penilaian kinerja pegawai.');
L.push('');
L.push('*2️⃣ PERSETUJUAN ATAS REALISASI KINERJA*');
L.push('📅 Batas waktu persetujuan atas realisasi kinerja: *paling lambat tanggal '+batasSetuju+'*');
L.push('Mohon Bapak/Ibu Admin TPP melakukan:');
L.push('✅ Login ke aplikasi KENDALI di '+linkApp);
L.push('✅ Buka menu *Persetujuan TPP → Isi Persetujuan*');
L.push('✅ Centang konfirmasi tanggal 7 (input realisasi kinerja) dan tanggal 10 (persetujuan atas realisasi kinerja) untuk periode *'+periodeLabel+'*');
L.push('✅ Buat Berita Acara Persetujuan TPP');
L.push('✅ Bila memakai tanda tangan MANUAL: cetak, minta tanda tangan Kepala OPD & stempel, lalu unggah kembali dokumen hasilnya ke aplikasi');
L.push('ℹ️ Bila KEDUA penanda tangan memakai tanda tangan ELEKTRONIK (QR), Berita Acara otomatis berstatus FINAL dan tidak perlu diunggah ulang.');
L.push('');
L.push('*🔐 KREDENSIAL LOGIN:*');
L.push('🔗 '+linkApp);
L.push('👤 NIP / ID User: sesuai data yang telah diberikan');
L.push('🔑 Password: sesuai data yang telah diberikan');
L.push('');
L.push('*📞 Dukungan Teknis:*');
L.push('PIC Pendamping wilayah: *'+picNama+'*');
L.push('Bagian Organisasi Setda Kabupaten Banyuwangi — Telepon 0333-425001');
L.push('');
L.push('─────────────────────────────');
L.push('Hormat kami,');
L.push('*'+u.nama+'*');
L.push('Tim KENDALI — Bagian Organisasi');
L.push('Setda Kabupaten Banyuwangi');
L.push('─────────────────────────────');
var pesan=L.join(NLK);
writeLog(actorNip,'TPP','Generate Pemberitahuan',periodeLabel,'Batas input '+batasInput+' • batas setuju '+batasSetuju+' • target '+(u.role==='Superadmin'?'seluruh OPD':skpdList.length+' SKPD'));
return {success:true,pesan:pesan,
bulanNama:namaBulan,tahun:th,
periodeLabel:periodeLabel,periodeBulan:pb,periodeTahun:pt,
batasInput:batasInput,batasSetuju:batasSetuju,
judul:'Persetujuan Kinerja bulan '+periodeLabel,
jumlahSKPD:u.role==='Superadmin'?OPD_LIST().length:skpdList.length,
skpdList:skpdList,dikirimOleh:u.nama,owner_nip:u.nip,owner_role:u.role,picNama:picNama,linkApp:linkApp};
}catch(e){ Logger.log('generatePemberitahuanTPP: '+e); return {success:false,message:'Error: '+e.message}; }
}

//============================================
// MIGRASI PIC PADA DATA TPP (jalankan sekali)
//============================================
function refreshPICDataTPP(){
try{
var s=setupTPPSheets(), live=SKPD_PIC_MAP(), idx={};
for(var i=0;i<live.length;i++) idx[canon(live[i].skpd)]={nip:live[i].pic_nip,nama:live[i].pic_nama};
var ch=0, detail=[];
if(s.getLastRow()>1){
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues(), out=[];
for(var j=0;j<d.length;j++){
var skpd=String(d[j][1]||''), p=idx[canon(skpd)]||picOfSkpd(skpd);
var oldN=String(d[j][19]||'');
out.push([p.pic_nip,p.pic_nama]);
if(oldN!==p.pic_nama){ ch++; if(detail.length<40) detail.push(skpd+': '+oldN+' → '+p.pic_nama); } }
s.getRange(2,19,out.length,2).setValues(out); }
try{ setupSKPDSheet(); }catch(e){}
var hasil=['=== REFRESH PIC SELESAI ===','Baris Data_TPP diperbarui: '+ch,''].concat(detail).join(NLK);
Logger.log(hasil); return hasil;
}catch(e){ Logger.log('refreshPICDataTPP: '+e); return 'ERROR: '+e.message; }
}



//============================================
// PERBAIKAN PIC — v18 (wajib di paling bawah)
//============================================
function picOfSkpd(skpd){
var c=canon(skpd), map=SKPD_PIC_MAP(), i;
for(i=0;i<map.length;i++) if(canon(map[i].skpd)===c)
return {pic_nip:String(map[i].pic_nip||''),pic_nama:String(map[i].pic_nama||'-')};
var list=OPD_LIST();
for(i=0;i<list.length;i++){
var kc=canon(list[i]);
if(kc===c||kc.indexOf(c)>-1||c.indexOf(kc)>-1){
for(var j=0;j<map.length;j++) if(canon(map[j].skpd)===kc)
return {pic_nip:String(map[j].pic_nip||''),pic_nama:String(map[j].pic_nama||'-')};
}
}
return {pic_nip:'',pic_nama:'-'};
}

function getPICForSkpd(skpd){
var p=picOfSkpd(skpd);
return {skpd:skpd,pic_nip:p.pic_nip,pic_nama:p.pic_nama,jenis:jenisSkpd(skpd),kode:kodeSkpd(skpd)};
}

function refreshPICDataTPP(){
var NL=String.fromCharCode(10);
try{
var s=setupTPPSheets(), map=SKPD_PIC_MAP(), idx={}, i;
for(i=0;i<map.length;i++)
idx[canon(map[i].skpd)]={pic_nip:String(map[i].pic_nip||''),pic_nama:String(map[i].pic_nama||'-')};
var total=0, ch=0, detail=[], kosong=0;
if(s.getLastRow()>1){
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues(), out=[];
for(var j=0;j<d.length;j++){
var skpd=String(d[j][1]||'').trim();
if(!skpd){ out.push([String(d[j][18]||''),String(d[j][19]||'')]); continue; }
total++;
var p=idx[canon(skpd)]||picOfSkpd(skpd);
if(p.pic_nama==='-') kosong++;
var oldN=String(d[j][19]||'').trim();
out.push([p.pic_nip,p.pic_nama]);
if(oldN!==p.pic_nama){
ch++;
if(detail.length<60) detail.push(skpd+': '+(oldN||'(kosong)')+' → '+p.pic_nama);
}
}
s.getRange(2,19,out.length,2).setValues(out);
}
try{ setupSKPDSheet(); detail.push('Sheet Data_SKPD dibangun ulang.'); }catch(e){ detail.push('Peringatan Data_SKPD: '+e.message); }
var hasil=['=== REFRESH PIC SELESAI ===',
'Total baris Data_TPP: '+total,
'Baris diperbarui: '+ch,
'SKPD tanpa PIC dikenali: '+kosong,''].concat(detail).join(NL);
Logger.log(hasil);
return hasil;
}catch(e){ Logger.log('refreshPICDataTPP: '+e); return 'ERROR: '+e.message; }
}

function cekPICDataTPP(){
var NL=String.fromCharCode(10);
try{
var s=setupTPPSheets();
if(s.getLastRow()<2) return 'Data_TPP masih kosong.';
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
var benar=0, salah=0, detail=[];
for(var j=0;j<d.length;j++){
var skpd=String(d[j][1]||'').trim(); if(!skpd) continue;
var should=picOfSkpd(skpd).pic_nama;
var actual=String(d[j][19]||'').trim();
if(actual===should){ benar++; }
else { salah++; if(detail.length<40) detail.push('Baris '+(j+2)+' '+skpd+': tertulis "'+actual+'" seharusnya "'+should+'"'); }
}
var hasil=['=== CEK PIC Data_TPP ===','COCOK: '+benar,'BELUM: '+salah,''].concat(detail).join(NL);
Logger.log(hasil); return hasil;
}catch(e){ return 'ERROR: '+e.message; }
}

function cekWilayahLogin(){
var NL=String.fromCharCode(10);
try{
var sh=findUserSheet();
if(!sh) return 'ERROR: Sheet user tidak ditemukan.';
var m=getUserSheetMap(sh);
var lines=['=== PEMBACAAN Data_Users ===',
'Nama sheet: '+sh.getName(),
'Kolom identitas: '+colLetter(m.nip)+' ('+(m.headers[m.nip]||'-')+')',
'Kolom role: '+colLetter(m.role)+' ('+(m.headers[m.role]||'-')+')',
'Kolom nama: '+colLetter(m.nama)+' ('+(m.headers[m.nama]||'-')+')',
'Kolom wilayah: '+colLetter(m.opd)+' ('+(m.opd>=0?(m.headers[m.opd]||'-'):'TIDAK TERDETEKSI')+')',''];
var d=sh.getRange(2,1,sh.getLastRow()-1,m.lastCol).getValues();
for(var j=0;j<d.length;j++){
var id=String(d[j][m.nip]||'').trim(); if(!id) continue;
var nama=String(d[j][m.nama]||'').trim();
var role=normalizeRole(d[j][m.role]);
lines.push(id+'  ['+roleLabel(role)+']  '+nama);
if(role==='Superadmin'){ lines.push('   Akses: seluruh '+OPD_LIST().length+' SKPD'); }
else if(role==='TeamInternal'){
var rn=resolvePICNip(id,nama);
var wil=getSkpdForActor(id);
lines.push('   PIC tercocok: '+(rn||'TIDAK ADA'));
lines.push('   Wilayah ('+wil.length+' SKPD): '+(wil.join('; ')||'(kosong)'));
} else {
lines.push('   OPD: '+String(m.opd>=0?(d[j][m.opd]||''):''));
}
lines.push('');
}
var hasil=lines.join(NL);
Logger.log(hasil); return hasil;
}catch(e){ return 'ERROR: '+e.message; }
}



//============================================
// BLOK v19 — BACKFILL 2026 & ARSIP PEMBERITAHUAN
//============================================
var NL19=String.fromCharCode(10);

function readTPP(year,cfg){
var s=setupTPPSheets(), map={}, lock=String(cfg.KUNCI_SETERAH_BA||'YA').toUpperCase()==='YA', sigMap=readSignaturesMap();
if(s.getLastRow()<2) return map;
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
for(var i=0;i<d.length;i++){
if(String(d[i][3])!==String(year)) continue;
var id=String(d[i][0]), skpd=String(d[i][1]), live=picOfSkpd(skpd);
var sg=sigMap[id]||[], sa=null, sk2=null;
for(var q=0;q<sg.length;q++){ if(sg[q].status==='DICABUT') continue;
if(sg[q].peran==='ADMIN') sa=sg[q]; else if(sg[q].peran==='KEPALA') sk2=sg[q]; }
var p7=dtParts(d[i][6]), p10=dtParts(d[i][10]), fin=String(d[i][21]||'');
var hist=String(d[i][23]||'').toLowerCase()==='historis';
var rec={id:id,skpd:skpd,kode:String(d[i][2]),tahun:String(d[i][3]),bulan:Number(d[i][4]),
tgl7:String(d[i][5])==='YA',tgl7_waktu:fmtDT(d[i][6]),tgl7_tgl:p7.tgl,tgl7_jam:p7.jam,tgl7_oleh:String(d[i][8]||''),tgl7_nip:String(d[i][7]||''),
tgl10:String(d[i][9])==='YA',tgl10_waktu:fmtDT(d[i][10]),tgl10_tgl:p10.tgl,tgl10_jam:p10.jam,tgl10_oleh:String(d[i][12]||''),tgl10_nip:String(d[i][11]||''),
status:String(d[i][13]||'Belum'),ba_nomor:String(d[i][14]||''),ba_file_id:String(d[i][15]||''),ba_waktu:fmtDT(d[i][16]),ba_oleh:String(d[i][17]||''),
pic_nip:live.pic_nip,pic_nama:live.pic_nama,
final_file_id:fin,final_name:String(d[i][22]||''),final_type:String(d[i][23]||''),final_size:Number(d[i][24]||0),
final_upload:fmtDT(d[i][25]),final_by:String(d[i][26]||''),
sig_admin:sa,sig_kepala:sk2,signatures:sg,rowIndex:i+2};
rec.historis=hist;
rec.elektronik_penuh=!!(sa&&sk2);
rec.is_final=!!(fin||rec.elektronik_penuh||hist);
rec.final_mode=fin?'UNGGAH':(rec.elektronik_penuh?'ELEKTRONIK':(hist?'HISTORIS':''));
rec.metode=baMetodeLabel(rec);
rec.locked=!!(rec.ba_file_id&&lock);
map[tppKey(skpd,d[i][3],d[i][4])]=rec; }
return map;
}

function emptyTPPRec(skpd,yr,b,info){
var live=picOfSkpd(skpd);
return {id:'',skpd:skpd,kode:(info&&info.kode)||kodeSkpd(skpd),tahun:String(yr),bulan:b,
tgl7:false,tgl7_waktu:'',tgl7_tgl:'',tgl7_jam:'',tgl7_oleh:'',
tgl10:false,tgl10_waktu:'',tgl10_tgl:'',tgl10_jam:'',tgl10_oleh:'',
status:'Belum',ba_nomor:'',ba_file_id:'',ba_waktu:'',ba_oleh:'',
pic_nip:live.pic_nip,pic_nama:live.pic_nama,
final_file_id:'',final_name:'',final_type:'',final_size:0,final_upload:'',final_by:'',
sig_admin:null,sig_kepala:null,signatures:[],
historis:false,elektronik_penuh:false,is_final:false,final_mode:'',metode:'MANUAL',locked:false};
}

//============================================
// BACKFILL PERSETUJUAN HISTORIS
//============================================
function backfillTPP(tahun,bulanAwal,bulanAkhir,tandaiHistoris,timpa){
try{
var th=Number(tahun)||2026, b1=Number(bulanAwal)||1, b2=Number(bulanAkhir)||10;
var historis=(tandaiHistoris!==false), paksa=(timpa===true);
var s=setupTPPSheets(), list=OPD_LIST();
var akun={};
try{
var sh=findUserSheet();
if(sh&&sh.getLastRow()>1){
var m=getUserSheetMap(sh), du=sh.getRange(2,1,sh.getLastRow()-1,m.lastCol).getValues();
for(var a=0;a<du.length;a++){
if(normalizeRole(du[a][m.role])!=='UserOPD') continue;
var op=String(m.opd>=0?(du[a][m.opd]||''):'').trim(); if(!op) continue;
akun[canon(op)]={nip:String(du[a][m.nip]||'').trim(),nama:String(du[a][m.nama]||'').trim()};
}
}
}catch(e){}
var idx={}, last=s.getLastRow();
if(last>1){
var d=s.getRange(2,1,last-1,27).getValues();
for(var j=0;j<d.length;j++) idx[canon(d[j][1])+'|'+String(d[j][3])+'|'+Number(d[j][4])]={row:j+2,data:d[j]};
}
var baru=0, update=0, lewati=0, detail=[];
for(var i=0;i<list.length;i++){
var skpd=list[i], info=getPICForSkpd(skpd), who=akun[canon(skpd)]||{nip:'MIGRASI',nama:'Admin '+skpd};
for(var b=b1;b<=b2;b++){
var key=canon(skpd)+'|'+th+'|'+b, ex=idx[key], cur=ex?ex.data:null;
if(cur&&String(cur[15]||'')&&!paksa){ lewati++; continue; }
if(cur&&String(cur[5])==='YA'&&String(cur[9])==='YA'&&!paksa){ lewati++; continue; }
var ny=th, nm=b+1; if(nm>12){ nm=1; ny=th+1; }
var w7=new Date(ny,nm-1,7,9,0,0), w10=new Date(ny,nm-1,10,9,30,0);
var id=cur?String(cur[0]):('TPP-'+info.kode+'-'+th+'-'+(b<10?'0'+b:b));
var row=[id,skpd,info.kode,String(th),b,'YA',w7,who.nip,who.nama,'YA',w10,who.nip,who.nama,'Lengkap',
cur?String(cur[14]||''):'',cur?String(cur[15]||''):'',cur?cur[16]:'',cur?String(cur[17]||''):'',
info.pic_nip,info.pic_nama,new Date(),
cur?String(cur[21]||''):'',
historis?'HISTORIS — data pra-aplikasi':(cur?String(cur[22]||''):''),
historis?'historis':(cur?String(cur[23]||''):''),
cur?Number(cur[24]||0):0,
historis?w10:(cur?cur[25]:''),
historis?'Migrasi Sistem':(cur?String(cur[26]||''):'')];
if(ex){ s.getRange(ex.row,1,1,27).setValues([row]); update++; }
else { s.appendRow(row); baru++; }
}
}
if(detail.length<10) detail.push('Contoh periode: '+BULAN_ID[b1-1]+' '+th+' s.d. '+BULAN_ID[b2-1]+' '+th);
var hasil=['=== BACKFILL SELESAI ===',
'Tahun: '+th+'  Periode: '+BULAN_ID[b1-1]+' – '+BULAN_ID[b2-1],
'SKPD diproses: '+list.length,
'Baris baru: '+baru,
'Baris diperbarui: '+update,
'Dilewati (sudah lengkap / sudah ada BA): '+lewati,
'Ditandai historis: '+(historis?'YA':'TIDAK'),''].concat(detail).join(NL19);
Logger.log(hasil); return hasil;
}catch(e){ Logger.log('backfillTPP: '+e); return 'ERROR: '+e.message; }
}

function backfillTPP2026(){ return backfillTPP(2026,1,10,true,false); }

function cekBackfill2026(){
var th=2026, s=setupTPPSheets(), lines=['=== CEK DATA 2026 ==='];
if(s.getLastRow()<2) return 'Data_TPP kosong.';
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues(), cnt={};
for(var i=0;i<d.length;i++){
if(String(d[i][3])!==String(th)) continue;
var b=Number(d[i][4]); if(!cnt[b]) cnt[b]={lengkap:0,historis:0,ba:0,total:0};
cnt[b].total++;
if(String(d[i][13])==='Lengkap') cnt[b].lengkap++;
if(String(d[i][23]||'').toLowerCase()==='historis') cnt[b].historis++;
if(String(d[i][15]||'')) cnt[b].ba++;
}
for(var b=1;b<=12;b++){
var c=cnt[b]||{lengkap:0,historis:0,ba:0,total:0};
lines.push(BULAN_ID[b-1]+': '+c.total+' baris • Lengkap '+c.lengkap+' • Historis '+c.historis+' • Draft BA '+c.ba);
}
var hasil=lines.join(NL19); Logger.log(hasil); return hasil;
}

//============================================
// ARSIP PEMBERITAHUAN
//============================================
function setupPemberitahuanSheet(){
var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Data_Pemberitahuan');
if(!s){
s=ss.insertSheet('Data_Pemberitahuan');
s.appendRow(['ID','Waktu','NIP_Pembuat','Nama_Pembuat','Role','Bulan','Tahun','Periode','Jumlah_SKPD','Judul','Pesan']);
s.getRange(1,1,1,11).setFontWeight('bold').setBackground('#fef3c7'); s.setFrozenRows(1);
}
return s;
}
function savePemberitahuan(o,actorNip){
try{
var u=findUserRow(actorNip);
if(!u) return {success:false,message:'Sesi tidak valid.'};
if(u.role!=='Superadmin'&&u.role!=='TeamInternal') return {success:false,message:'Tidak berwenang.'};
if(!o||!o.pesan) return {success:false,message:'Teks pemberitahuan kosong.'};
var s=setupPemberitahuanSheet(), id='NTF-'+Utilities.getUuid().substring(0,8).toUpperCase();
s.appendRow([id,new Date(),u.nip,u.nama,roleLabel(u.role),Number(o.bulan)||0,Number(o.tahun)||0,
String(o.periode||''),Number(o.jumlahSKPD)||0,String(o.judul||''),String(o.pesan)]);
return {success:true,id:id,message:'Pemberitahuan diarsipkan.'};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}
function getPemberitahuanList(actorNip,limit){
try{
var u=findUserRow(actorNip); if(!u) return [];
var s=setupPemberitahuanSheet(); if(s.getLastRow()<2) return [];
var d=s.getRange(2,1,s.getLastRow()-1,11).getValues(), out=[];
for(var i=d.length-1;i>=0;i--){
var own=String(d[i][2]||'')===String(u.nip);
if(u.role!=='Superadmin'&&!own) continue;
out.push({id:String(d[i][0]),waktu:fmtDT(d[i][1]),nip:String(d[i][2]||''),nama:String(d[i][3]||''),
role:String(d[i][4]||''),bulan:Number(d[i][5]),tahun:Number(d[i][6]),periode:String(d[i][7]||''),
jumlah:Number(d[i][8]||0),judul:String(d[i][9]||''),pesan:String(d[i][10]||''),milikSendiri:own});
if(out.length>=(limit||50)) break;
}
return out;
}catch(e){ return []; }
}
function deletePemberitahuan(id,actorNip){
try{
var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
var s=setupPemberitahuanSheet(); if(s.getLastRow()<2) return {success:false,message:'Arsip kosong.'};
var d=s.getRange(2,1,s.getLastRow()-1,11).getValues();
for(var i=0;i<d.length;i++) if(String(d[i][0])===String(id)){
if(u.role!=='Superadmin'&&String(d[i][2]||'')!==String(u.nip)) return {success:false,message:'Hanya pembuat atau Superadmin yang dapat menghapus.'};
s.deleteRow(i+2);
writeLog(actorNip,'TPP','Hapus Arsip Pemberitahuan',id,String(d[i][7]||''));
return {success:true,message:'Arsip pemberitahuan dihapus.'};
}
return {success:false,message:'Arsip tidak ditemukan.'};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}



//============================================
// ARSIP PEMBERITAHUAN — v21 (mandiri + diagnostik)
//============================================
function setupPemberitahuanSheet(){
var ss=SpreadsheetApp.getActiveSpreadsheet(), s=ss.getSheetByName('Data_Pemberitahuan');
if(!s){
s=ss.insertSheet('Data_Pemberitahuan');
s.getRange(1,1,1,11).setValues([['ID','Waktu','NIP_Pembuat','Nama_Pembuat','Role','Bulan','Tahun','Periode','Jumlah_SKPD','Judul','Pesan']]);
s.getRange(1,1,1,11).setFontWeight('bold').setBackground('#fef3c7');
s.setFrozenRows(1);
s.setColumnWidth(11,600);
Logger.log('setupPemberitahuanSheet: sheet baru dibuat');
}
return s;
}

function savePemberitahuan(o,actorNip){
try{
var u=findUserRow(actorNip);
if(!u){ Logger.log('savePemberitahuan: actor tidak ditemukan = '+actorNip); return {success:false,message:'Akun "'+actorNip+'" tidak ditemukan di sheet user.'}; }
if(u.role!=='Superadmin'&&u.role!=='TeamInternal'){ Logger.log('savePemberitahuan: role ditolak = '+u.role); return {success:false,message:'Role '+roleLabel(u.role)+' tidak berwenang mengarsipkan.'}; }
if(!o||!o.pesan){ Logger.log('savePemberitahuan: pesan kosong'); return {success:false,message:'Teks pemberitahuan kosong — tidak diarsipkan.'}; }
var s=setupPemberitahuanSheet();
var id='NTF-'+Utilities.getUuid().substring(0,8).toUpperCase();
s.appendRow([id,new Date(),String(u.nip),String(u.nama),roleLabel(u.role),
Number(o.bulan)||0,Number(o.tahun)||0,String(o.periode||''),Number(o.jumlahSKPD)||0,
String(o.judul||''),String(o.pesan)]);
SpreadsheetApp.flush();
var n=s.getLastRow();
Logger.log('savePemberitahuan SUKSES: '+id+' | actor='+u.nip+' | total baris='+n);
return {success:true,id:id,row:n,message:'Tersimpan di Data_Pemberitahuan baris '+n+'.'};
}catch(e){
Logger.log('savePemberitahuan ERROR: '+e+' || '+(e&&e.stack));
return {success:false,message:'Error server: '+e.message};
}
}

function getPemberitahuanList(actorNip,limit){
try{
var u=findUserRow(actorNip);
if(!u){ Logger.log('getPemberitahuanList: actor tidak ditemukan = '+actorNip); return []; }
var s=setupPemberitahuanSheet(), n=s.getLastRow();
Logger.log('getPemberitahuanList: actor='+u.nip+' | role='+u.role+' | barisData='+Math.max(n-1,0));
if(n<2) return [];
var d=s.getRange(2,1,n-1,11).getValues(), out=[];
for(var i=d.length-1;i>=0;i--){
var own=String(d[i][2]||'').trim()===String(u.nip).trim();
if(u.role!=='Superadmin'&&!own) continue;
out.push({id:String(d[i][0]),waktu:fmtDT(d[i][1]),nip:String(d[i][2]||''),nama:String(d[i][3]||''),
role:String(d[i][4]||''),bulan:Number(d[i][5]),tahun:Number(d[i][6]),periode:String(d[i][7]||''),
jumlah:Number(d[i][8]||0),judul:String(d[i][9]||''),pesan:String(d[i][10]||''),milikSendiri:own});
if(out.length>=(limit||50)) break;
}
Logger.log('getPemberitahuanList: dikembalikan '+out.length+' baris untuk '+u.nip);
return out;
}catch(e){ Logger.log('getPemberitahuanList ERROR: '+e); return []; }
}

function deletePemberitahuan(id,actorNip){
try{
var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.'};
var s=setupPemberitahuanSheet(); if(s.getLastRow()<2) return {success:false,message:'Arsip kosong.'};
var d=s.getRange(2,1,s.getLastRow()-1,11).getValues();
for(var i=0;i<d.length;i++) if(String(d[i][0])===String(id)){
if(u.role!=='Superadmin'&&String(d[i][2]||'').trim()!==String(u.nip).trim()) return {success:false,message:'Hanya pembuat atau Superadmin yang dapat menghapus.'};
s.deleteRow(i+2);
Logger.log('deletePemberitahuan: '+id+' oleh '+u.nip);
return {success:true,message:'Arsip dihapus.'};
}
return {success:false,message:'Arsip tidak ditemukan.'};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

function cekArsipPemberitahuan(){
var NL=String.fromCharCode(10);
var s=setupPemberitahuanSheet(), n=s.getLastRow();
var lines=['=== ISI Data_Pemberitahuan ===','Total baris data: '+Math.max(n-1,0),''];
if(n>1){
var d=s.getRange(2,1,n-1,11).getValues();
for(var i=0;i<d.length;i++)
lines.push('baris '+(i+2)+' | NIP="'+String(d[i][2])+'" | '+String(d[i][3])+' | '+String(d[i][7])+' | '+fmtDT(d[i][1]));
}
var hasil=lines.join(NL); Logger.log(hasil); return hasil;
}

function tesArsipPemberitahuan(actorNip){
var NL=String.fromCharCode(10);
var actor=String(actorNip||'').trim();
if(!actor){
var sh=findUserSheet();
if(sh&&sh.getLastRow()>1){
var m=getUserSheetMap(sh), d=sh.getRange(2,1,sh.getLastRow()-1,m.lastCol).getValues();
for(var i=0;i<d.length;i++) if(normalizeRole(d[i][m.role])==='TeamInternal'){ actor=String(d[i][m.nip]).trim(); break; }
}
}
if(!actor) return 'ERROR: tidak ada akun TeamInternal untuk uji coba.';
var r=savePemberitahuan({bulan:12,tahun:2026,periode:'November 2026',jumlahSKPD:6,
judul:'UJI ARSIP — boleh dihapus',pesan:'Baris uji coba penyimpanan arsip pemberitahuan.'},actor);
var s=setupPemberitahuanSheet(), l=getPemberitahuanList(actor,50);
var hasil=['=== UJI ARSIP PEMBERITAHUAN ===','Akun uji: '+actor,
'Hasil simpan: '+JSON.stringify(r),'Total baris sheet: '+Math.max(s.getLastRow()-1,0),
'Terbaca kembali oleh akun itu: '+l.length+' baris'].join(NL);
Logger.log(hasil); return hasil;
}





//============================================
// BLOK v22 — RESET PAKSA & HISTORIS 2026
//============================================
var NL22=String.fromCharCode(10);

function getPICForSkpd(skpd){
var c=canon(skpd), map=SKPD_PIC_MAP(), i;
for(i=0;i<map.length;i++) if(canon(map[i].skpd)===c) return map[i];
var list=OPD_LIST();
for(i=0;i<list.length;i++){ var k=canon(list[i]);
if(k===c||k.indexOf(c)>-1||c.indexOf(k)>-1){
for(var j=0;j<map.length;j++) if(canon(map[j].skpd)===k) return map[j]; } }
return {skpd:skpd,pic_nip:'',pic_nama:'-',jenis:jenisSkpd(skpd),kode:kodeSkpd(skpd)};
}

function readTPP(year,cfg){
var s=setupTPPSheets(), map={}, lock=String(cfg.KUNCI_SETERAH_BA||'YA').toUpperCase()==='YA', sigMap=readSignaturesMap();
if(s.getLastRow()<2) return map;
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
for(var i=0;i<d.length;i++){
if(String(d[i][3])!==String(year)) continue;
var id=String(d[i][0]), skpd=String(d[i][1]), live=getPICForSkpd(skpd);
var sg=sigMap[id]||[], sa=null, sk2=null;
for(var q=0;q<sg.length;q++){ if(sg[q].status==='DICABUT') continue;
if(sg[q].peran==='ADMIN') sa=sg[q]; else if(sg[q].peran==='KEPALA') sk2=sg[q]; }
var p7=dtParts(d[i][6]), p10=dtParts(d[i][10]);
var ba=String(d[i][15]||''), fin=String(d[i][21]||''), hist=String(d[i][23]||'').toLowerCase()==='historis';
var rec={id:id,skpd:skpd,kode:String(d[i][2]),tahun:String(d[i][3]),bulan:Number(d[i][4]),
tgl7:String(d[i][5])==='YA',tgl7_waktu:fmtDT(d[i][6]),tgl7_tgl:p7.tgl,tgl7_jam:p7.jam,tgl7_oleh:String(d[i][8]||''),tgl7_nip:String(d[i][7]||''),
tgl10:String(d[i][9])==='YA',tgl10_waktu:fmtDT(d[i][10]),tgl10_tgl:p10.tgl,tgl10_jam:p10.jam,tgl10_oleh:String(d[i][12]||''),tgl10_nip:String(d[i][11]||''),
status:String(d[i][13]||'Belum'),ba_nomor:String(d[i][14]||''),ba_file_id:ba,ba_waktu:fmtDT(d[i][16]),ba_oleh:String(d[i][17]||''),
pic_nip:live.pic_nip,pic_nama:live.pic_nama,
final_file_id:fin,final_name:String(d[i][22]||''),final_type:String(d[i][23]||''),final_size:Number(d[i][24]||0),
final_upload:fmtDT(d[i][25]),final_by:String(d[i][26]||''),
sig_admin:sa,sig_kepala:sk2,signatures:sg,rowIndex:i+2};
rec.historis=hist;
rec.elektronik_penuh=!!(sa&&sk2);
rec.is_final=!!(fin||rec.elektronik_penuh||hist);
rec.final_mode=fin?'UNGGAH':(rec.elektronik_penuh?'ELEKTRONIK':(hist?'HISTORIS':''));
rec.locked=!!(ba&&lock);
map[tppKey(skpd,d[i][3],d[i][4])]=rec; }
return map;
}

function emptyTPPRec(skpd,yr,b,info){
var live=getPICForSkpd(skpd);
return {id:'',skpd:skpd,kode:(info&&info.kode)||kodeSkpd(skpd),tahun:String(yr),bulan:b,
tgl7:false,tgl7_waktu:'',tgl7_tgl:'',tgl7_jam:'',tgl7_oleh:'',
tgl10:false,tgl10_waktu:'',tgl10_tgl:'',tgl10_jam:'',tgl10_oleh:'',
status:'Belum',ba_nomor:'',ba_file_id:'',ba_waktu:'',ba_oleh:'',
pic_nip:live.pic_nip,pic_nama:live.pic_nama,
final_file_id:'',final_name:'',final_type:'',final_size:0,final_upload:'',final_by:'',
sig_admin:null,sig_kepala:null,signatures:[],
historis:false,elektronik_penuh:false,is_final:false,final_mode:'',locked:false};
}

function getTPPMatrix(year,actorNip){
try{
var u=findUserRow(actorNip); if(!u) return {success:false,message:'Sesi tidak valid.',rows:[]};
var yr=Number(year)||new Date().getFullYear(), cfg=getTPPConfig(), pa=getPeriodeAktif(), now=new Date();
var mine=getSkpdForActor(actorNip), map=readTPP(yr,cfg), rows=[], prof={};
var ps=setupProfilOPD();
if(ps.getLastRow()>1){ var pd=ps.getRange(2,1,ps.getLastRow()-1,21).getValues(); for(var p=0;p<pd.length;p++) prof[canon(pd[p][0])]=profilObj(pd[p],false); }
for(var i=0;i<mine.length;i++){
var sk=mine[i], info=getPICForSkpd(sk), months=[];
for(var b=1;b<=12;b++){
var rec=map[tppKey(sk,yr,b)]||emptyTPPRec(sk,yr,b,info);
rec.eligible=periodeLE(yr,b,pa.tahun,pa.bulan)||String(cfg.KUNCI_PERIODE||'YA').toUpperCase()!=='YA';
rec.isAktif=(yr===pa.tahun&&b===pa.bulan);
rec.win7=windowOpen(yr,b,'7',cfg,now); rec.win10=windowOpen(yr,b,'10',cfg,now);
months.push(rec); }
var lg=0,sb=0,ba2=0,fn2=0;
for(var j=0;j<months.length;j++){
if(months[j].status==='Lengkap')lg++; else if(months[j].status==='Sebagian')sb++;
if(months[j].ba_file_id)ba2++;
if(months[j].is_final)fn2++; }
rows.push({skpd:sk,kode:info.kode,jenis:info.jenis,pic_nip:info.pic_nip,pic_nama:info.pic_nama,months:months,
lengkap:lg,sebagian:sb,belum:12-lg-sb,ba_count:ba2,final_count:fn2,progress:Math.round(lg/12*100),
profil:prof[canon(sk)]||{skpd:sk,admin:{jabatan:defaultJabatanAdmin(sk),nama:'',nip:'',pangkat:'',ttd_file_id:'',metode:normMetode(cfg.METODE_TTD_DEFAULT)},kepala:{jabatan:defaultJabatanKepala(sk),nama:'',nip:'',pangkat:'',ttd_file_id:'',metode:normMetode(cfg.METODE_TTD_DEFAULT),has_pin:false},lengkap:false}}); }
rows.sort(function(a,b){ return a.skpd.localeCompare(b.skpd); });
var pics={}, plist=[];
for(var x=0;x<rows.length;x++){ var kk=rows[x].pic_nip||'-';
if(!pics[kk]){ pics[kk]=true; plist.push({nip:kk,nama:rows[x].pic_nama||'Tanpa PIC'}); } }
plist.sort(function(a,b){ return a.nama.localeCompare(b.nama); });
return {success:true,year:yr,role:u.role,nama:u.nama,rows:rows,config:cfg,periodeAktif:pa,picList:plist,bulanNama:BULAN_ID,bulanShort:BULAN_SHORT};
}catch(e){ return {success:false,message:'Error: '+e.message,rows:[]}; }
}

function getComplianceCard(year,actorNip){
try{
var u=findUserRow(actorNip);
if(!u) return {success:false,message:'Sesi tidak valid.'};
if(u.role==='UserOPD') return {success:false,message:'Fitur ini untuk Tim Internal & Superadmin.'};
var cfg=getTPPConfig(), pa=getPeriodeAktif(), yr=Number(year)||pa.tahun;
var mine=getSkpdForActor(actorNip);
if(!mine.length) return {success:false,message:'Tidak ada SKPD terhubung.'};
var map=readTPP(pa.tahun,cfg), prof={};
var ps=setupProfilOPD();
if(ps.getLastRow()>1){ var pd=ps.getRange(2,1,ps.getLastRow()-1,21).getValues();
for(var p=0;p<pd.length;p++) prof[canon(pd[p][0])]=!!(String(pd[p][3]||'').trim()&&String(pd[p][4]||'').trim()&&String(pd[p][5]||'').trim()&&String(pd[p][11]||'').trim()&&String(pd[p][12]||'').trim()&&String(pd[p][13]||'').trim()); }
var a={lengkap:0,sebagian:0,belum:0,draft:0,final:0,no7:0,no10:0};
var profilKosong=[], perhatian=[], tunggakan=0, tunggakanList=[], perPic={};
for(var i=0;i<mine.length;i++){
var sk=mine[i], info=getPICForSkpd(sk), pn=info.pic_nama||'Tanpa PIC';
if(!perPic[pn]) perPic[pn]={pic_nama:pn,total:0,lengkap:0,final:0};
perPic[pn].total++;
var rec=map[tppKey(sk,pa.tahun,pa.bulan)]||emptyTPPRec(sk,pa.tahun,pa.bulan,info);
if(rec.status==='Lengkap'){a.lengkap++;perPic[pn].lengkap++;}
else if(rec.status==='Sebagian') a.sebagian++; else a.belum++;
if(rec.ba_file_id) a.draft++;
if(rec.is_final){a.final++;perPic[pn].final++;}
if(!rec.tgl7) a.no7++;
if(!rec.tgl10) a.no10++;
if(!prof[canon(sk)]&&!rec.historis){
profilKosong.push({skpd:sk,pic_nama:pn});
perhatian.push({skpd:sk,pic_nama:pn,tipe:'profil',masalah:'Profil penanda tangan belum lengkap'}); }
if(rec.status!=='Lengkap')
perhatian.push({skpd:sk,pic_nama:pn,tipe:'konfirmasi',masalah:'Konfirmasi '+pa.label+' masih '+rec.status});
else if(rec.ba_file_id&&!rec.is_final)
perhatian.push({skpd:sk,pic_nama:pn,tipe:'final',masalah:'Draft BA '+pa.label+' belum diunggah versi bertanda tangan'});
for(var b=1;b<=pa.bulan;b++){
var r2=map[tppKey(sk,pa.tahun,b)]||emptyTPPRec(sk,pa.tahun,b,info);
if(r2.status!=='Lengkap'||(r2.ba_file_id&&!r2.is_final)){
tunggakan++;
if(tunggakanList.length<25) tunggakanList.push({skpd:sk,pic_nama:pn,bulan:b,bulanNama:BULAN_ID[b-1],tahun:pa.tahun,status:r2.status,final:!!r2.is_final});
}}}
var total=mine.length, picArr=[];
for(var pk in perPic) picArr.push(perPic[pk]);
picArr.sort(function(x,y){ return (y.lengkap/y.total)-(x.lengkap/x.total); });
var urut={profil:0,konfirmasi:1,final:2};
perhatian.sort(function(x,y){ return (urut[x.tipe]||9)-(urut[y.tipe]||9); });
return {success:true,periode:pa,tahunTampilan:yr,total:total,aktif:a,
persenLengkap:total?Math.round(a.lengkap/total*100):0,
persenDraft:total?Math.round(a.draft/total*100):0,
persenFinal:total?Math.round(a.final/total*100):0,
profilKosongCount:profilKosong.length,profilKosong:profilKosong.slice(0,20),
perhatianCount:perhatian.length,perhatian:perhatian.slice(0,12),
tunggakanCount:tunggakan,tunggakan:tunggakanList,
perPic:picArr,isSuper:u.role==='Superadmin',nama:u.nama};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

//============================================
// RESET PAKSA PERIODE (timpa draft BA, lampiran, TTD)
//============================================
function resetTPPPeriode(tahun,bulanAwal,bulanAkhir,tandaiHistoris){
try{
var th=Number(tahun)||2026, b1=Number(bulanAwal)||1, b2=Number(bulanAkhir)||10;
var hist=(tandaiHistoris!==false);
var s=setupTPPSheets(), list=OPD_LIST(), last=s.getLastRow();
var rows=last>1?s.getRange(2,1,last-1,27).getValues():[];
var idx={};
for(var i=0;i<rows.length;i++) idx[canon(rows[i][1])+'|'+String(rows[i][3])+'|'+Number(rows[i][4])]=i;
var akun={};
try{
var sh=findUserSheet();
if(sh&&sh.getLastRow()>1){
var m=getUserSheetMap(sh), du=sh.getRange(2,1,sh.getLastRow()-1,m.lastCol).getValues();
for(var a=0;a<du.length;a++){
if(normalizeRole(du[a][m.role])!=='UserOPD') continue;
var op=String(m.opd>=0?(du[a][m.opd]||''):'').trim(); if(!op) continue;
akun[canon(op)]={nip:String(du[a][m.nip]||'').trim(),nama:String(du[a][m.nama]||'').trim()};
}}}catch(e){}
var trash=[], affected={}, baru=0, timpa=0, add=[];
for(var k=0;k<list.length;k++){
var skpd=list[k], info=getPICForSkpd(skpd), who=akun[canon(skpd)]||{nip:'MIGRASI',nama:'Admin '+skpd};
for(var b=b1;b<=b2;b++){
var key=canon(skpd)+'|'+th+'|'+b, pos=idx[key];
var old=(pos!==undefined)?rows[pos]:null;
var id=old?String(old[0]):('TPP-'+info.kode+'-'+th+'-'+(b<10?'0'+b:b));
if(old){
if(String(old[15]||'')) trash.push(String(old[15]));
if(String(old[21]||'')) trash.push(String(old[21]));
timpa++;
} else baru++;
affected[id]=true;
var ny=th, nm=b+1; if(nm>12){ nm=1; ny=th+1; }
var w7=new Date(ny,nm-1,7,9,0,0), w10=new Date(ny,nm-1,10,9,30,0);
var row=[id,skpd,info.kode,String(th),b,'YA',w7,who.nip,who.nama,'YA',w10,who.nip,who.nama,'Lengkap',
'','','','',info.pic_nip,info.pic_nama,new Date(),
'',hist?'HISTORIS — data pra-aplikasi':'',hist?'historis':'',0,hist?w10:'',hist?'Migrasi Sistem':''];
if(pos!==undefined) rows[pos]=row; else add.push(row);
}}
if(rows.length) s.getRange(2,1,rows.length,27).setValues(rows);
if(add.length) s.getRange(last+1,1,add.length,27).setValues(add);
var cabut=0;
try{
var ts=setupTTDSheet();
if(ts.getLastRow()>1){
var td=ts.getRange(2,1,ts.getLastRow()-1,21).getValues(), st=[];
for(var t2=0;t2<td.length;t2++){
var cur=String(td[t2][17]||'');
if(affected[String(td[t2][4]||'')]&&cur!=='DICABUT'){ st.push(['DICABUT']); cabut++; }
else st.push([cur]); }
ts.getRange(2,18,st.length,1).setValues(st);
}}catch(e){}
var gagal=0;
for(var f=0;f<trash.length;f++){ try{ DriveApp.getFileById(trash[f]).setTrashed(true); }catch(e){ gagal++; } }
var hasil=['=== RESET & HISTORIS SELESAI ===',
'Tahun '+th+'  periode '+BULAN_ID[b1-1]+' – '+BULAN_ID[b2-1],
'SKPD diproses: '+list.length,
'Baris ditimpa: '+timpa,
'Baris baru: '+baru,
'File BA & lampiran dipindah ke Trash: '+(trash.length-gagal)+' dari '+trash.length,
'Tanda tangan elektronik dicabut: '+cabut,
'Ditandai historis: '+(hist?'YA':'TIDAK')].join(NL22);
Logger.log(hasil); return hasil;
}catch(e){ Logger.log('resetTPPPeriode: '+e); return 'ERROR: '+e.message; }
}

function forceHistoris2026(){ return resetTPPPeriode(2026,1,10,true); }

function cekHistoris2026(){
var s=setupTPPSheets(), lines=['=== CEK DATA 2026 ==='];
if(s.getLastRow()<2) return 'Data_TPP kosong.';
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues(), c={};
for(var i=0;i<d.length;i++){
if(String(d[i][3])!=='2026') continue;
var b=Number(d[i][4]); if(!c[b]) c[b]={n:0,lg:0,hi:0,ba:0,fi:0};
c[b].n++;
if(String(d[i][13])==='Lengkap') c[b].lg++;
if(String(d[i][23]||'').toLowerCase()==='historis') c[b].hi++;
if(String(d[i][15]||'')) c[b].ba++;
if(String(d[i][21]||'')) c[b].fi++; }
for(var b=1;b<=12;b++){ var x=c[b]||{n:0,lg:0,hi:0,ba:0,fi:0};
lines.push(BULAN_ID[b-1]+': '+x.n+' baris • Lengkap '+x.lg+' • Historis '+x.hi+' • Draft BA '+x.ba+' • Upload BA '+x.fi); }
var h=lines.join(NL22); Logger.log(h); return h;
}



//============================================
// HAPUS DATA PERIODE TPP (Superadmin)
//============================================
function deleteTPPPeriode(skpd,year,month,actorNip){
try{
assertRole(actorNip,['Superadmin']);
var yr=Number(year), bl=Number(month);
if(!skpd||!yr||bl<1||bl>12) return {success:false,message:'Parameter tidak valid.'};
var s=setupTPPSheets();
if(s.getLastRow()<2) return {success:false,message:'Belum ada data TPP.'};
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues(), target=-1, rec=null;
for(var i=0;i<d.length;i++){
if(canon(d[i][1])===canon(skpd)&&String(d[i][3])===String(yr)&&Number(d[i][4])===bl){ target=i+2; rec=d[i]; break; } }
if(target<0) return {success:false,message:'Data '+BULAN_ID[bl-1]+' '+yr+' untuk '+skpd+' tidak ditemukan.'};
var id=String(rec[0]), files=[String(rec[15]||''),String(rec[21]||'')], trashed=0;
for(var f=0;f<files.length;f++){ if(files[f]){ try{ DriveApp.getFileById(files[f]).setTrashed(true); trashed++; }catch(e){} } }
var cabut=0;
try{
var ts=setupTTDSheet();
if(ts.getLastRow()>1){
var td=ts.getRange(2,1,ts.getLastRow()-1,21).getValues(), st=[];
for(var j=0;j<td.length;j++){
var cur=String(td[j][17]||'');
if(String(td[j][4]||'')===id&&cur!=='DICABUT'){ st.push(['DICABUT']); cabut++; } else st.push([cur]); }
ts.getRange(2,18,st.length,1).setValues(st); }
}catch(e){}
s.deleteRow(target);
writeLog(actorNip,'TPP','Hapus Data Periode',id,skpd+' • '+BULAN_ID[bl-1]+' '+yr+' • file ke Trash: '+trashed+' • TTD dicabut: '+cabut);
return {success:true,trashed:trashed,cabut:cabut,
message:'Data '+BULAN_ID[bl-1]+' '+yr+' untuk '+skpd+' dihapus. '+trashed+' file ke Trash, '+cabut+' tanda tangan elektronik dicabut.'};
}catch(e){ Logger.log('deleteTPPPeriode: '+e); return {success:false,message:'Error: '+e.message}; }
}

function deleteTPPPeriodeBulk(year,month,actorNip){
try{
assertRole(actorNip,['Superadmin']);
var yr=Number(year), bl=Number(month);
if(!yr||bl<1||bl>12) return {success:false,message:'Parameter tidak valid.'};
var s=setupTPPSheets();
if(s.getLastRow()<2) return {success:false,message:'Belum ada data TPP.'};
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
var rows=[], ids={}, files=[], nama=[];
for(var i=0;i<d.length;i++){
if(String(d[i][3])!==String(yr)||Number(d[i][4])!==bl) continue;
rows.push(i+2); ids[String(d[i][0])]=true;
if(String(d[i][15]||'')) files.push(String(d[i][15]));
if(String(d[i][21]||'')) files.push(String(d[i][21]));
if(nama.length<12) nama.push(String(d[i][1])); }
if(!rows.length) return {success:false,message:'Tidak ada data '+BULAN_ID[bl-1]+' '+yr+'.'};
var trashed=0;
for(var f=0;f<files.length;f++){ try{ DriveApp.getFileById(files[f]).setTrashed(true); trashed++; }catch(e){} }
var cabut=0;
try{
var ts=setupTTDSheet();
if(ts.getLastRow()>1){
var td=ts.getRange(2,1,ts.getLastRow()-1,21).getValues(), st=[];
for(var j=0;j<td.length;j++){
var cur=String(td[j][17]||'');
if(ids[String(td[j][4]||'')]&&cur!=='DICABUT'){ st.push(['DICABUT']); cabut++; } else st.push([cur]); }
ts.getRange(2,18,st.length,1).setValues(st); }
}catch(e){}
for(var k=rows.length-1;k>=0;k--) s.deleteRow(rows[k]);
writeLog(actorNip,'TPP','Hapus Massal Periode',BULAN_ID[bl-1]+' '+yr,rows.length+' baris dihapus • file: '+trashed+' • TTD: '+cabut);
return {success:true,deleted:rows.length,trashed:trashed,cabut:cabut,
message:rows.length+' data '+BULAN_ID[bl-1]+' '+yr+' dihapus. '+trashed+' file ke Trash, '+cabut+' tanda tangan elektronik dicabut.'};
}catch(e){ Logger.log('deleteTPPPeriodeBulk: '+e); return {success:false,message:'Error: '+e.message}; }
}



//============================================
// HAPUS DATA TPP TERPILIH (Superadmin)
//============================================
function resolveHapusTPP_(opts,actorNip){
assertRole(actorNip,['Superadmin']);
var o=opts||{}, th=Number(o.tahun)||0;
if(!th) return {error:'Tahun wajib dipilih.'};
var bl={}, arr=o.bulan||[];
for(var i=0;i<arr.length;i++){ var b=Number(arr[i]); if(b>=1&&b<=12) bl[b]=true; }
if(!Object.keys(bl).length) return {error:'Pilih minimal satu bulan.'};
var all=(!o.skpd||o.skpd==='ALL'), set={};
if(!all){
var sk=Array.isArray(o.skpd)?o.skpd:[o.skpd];
for(var j=0;j<sk.length;j++) set[canon(sk[j])]=true;
if(!Object.keys(set).length) return {error:'Pilih minimal satu SKPD.'};
}
var s=setupTPPSheets();
if(s.getLastRow()<2) return {rows:[],sheet:s};
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues(), rows=[];
for(var k=0;k<d.length;k++){
if(String(d[k][3])!==String(th)) continue;
var b2=Number(d[k][4]); if(!bl[b2]) continue;
var nm=String(d[k][1]||''); if(!all&&!set[canon(nm)]) continue;
rows.push({row:k+2,id:String(d[k][0]),skpd:nm,tahun:th,bulan:b2,
status:String(d[k][13]||'Belum'),tgl7:String(d[k][5])==='YA',tgl10:String(d[k][9])==='YA',
ba_nomor:String(d[k][14]||''),ba:String(d[k][15]||''),
fin:String(d[k][21]||''),fin_name:String(d[k][22]||''),
pic:String(d[k][19]||''),historis:String(d[k][23]||'').toLowerCase()==='historis'});
}
return {rows:rows,sheet:s};
}

function hitungTTDUntukIds_(ids){
try{
var ts=setupTTDSheet(); if(ts.getLastRow()<2) return 0;
var d=ts.getRange(2,1,ts.getLastRow()-1,21).getValues(), n=0;
for(var i=0;i<d.length;i++) if(ids[String(d[i][4]||'')]&&String(d[i][17]||'')!=='DICABUT') n++;
return n;
}catch(e){ return 0; }
}

function getOpsiHapusTPP(actorNip){
try{
assertRole(actorNip,['Superadmin']);
var s=setupTPPSheets(), tahun={}, rekap={};
if(s.getLastRow()>1){
var d=s.getRange(2,1,s.getLastRow()-1,27).getValues();
for(var i=0;i<d.length;i++){
var th=String(d[i][3]||''); if(!th) continue;
tahun[th]=true;
var key=th+'|'+Number(d[i][4]); rekap[key]=(rekap[key]||0)+1;
}
}
var ys=[]; for(var k in tahun) ys.push(Number(k));
ys.sort(function(a,b){ return b-a; });
if(!ys.length) ys=[new Date().getFullYear()];
var list=OPD_LIST(), skpd=[];
for(var j=0;j<list.length;j++){ var info=getPICForSkpd(list[j]); skpd.push({nama:list[j],pic:info.pic_nama}); }
return {success:true,skpd:skpd,tahun:ys,rekap:rekap};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

function previewHapusTPP(opts,actorNip){
try{
var r=resolveHapusTPP_(opts,actorNip);
if(r.error) return {success:false,message:r.error};
var ids={}, files=0, detail=[];
for(var i=0;i<r.rows.length;i++){
var x=r.rows[i]; ids[x.id]=true;
if(x.ba) files++; if(x.fin) files++;
if(detail.length<60) detail.push({skpd:x.skpd,bulan:x.bulan,bulanNama:BULAN_ID[x.bulan-1],tahun:x.tahun,
status:x.status,ba:x.ba_nomor,adaBa:!!x.ba,adaUnggahan:!!x.fin,historis:x.historis,pic:x.pic});
}
return {success:true,jumlah:r.rows.length,file:files,ttd:hitungTTDUntukIds_(ids),
detail:detail,lebih:Math.max(r.rows.length-detail.length,0)};
}catch(e){ return {success:false,message:'Error: '+e.message}; }
}

function hapusTPPTerpilih(opts,actorNip){
try{
var r=resolveHapusTPP_(opts,actorNip);
if(r.error) return {success:false,message:r.error};
if(!r.rows.length) return {success:false,message:'Tidak ada data yang cocok dengan pilihan.'};
var ids={}, files=[], nama=[];
for(var i=0;i<r.rows.length;i++){
var x=r.rows[i]; ids[x.id]=true;
if(x.ba) files.push(x.ba);
if(x.fin) files.push(x.fin);
if(nama.length<20) nama.push(x.skpd+' — '+BULAN_ID[x.bulan-1]+' '+x.tahun);
}
var trashed=0;
for(var f=0;f<files.length;f++){ try{ DriveApp.getFileById(files[f]).setTrashed(true); trashed++; }catch(e){} }
var cabut=0;
try{
var ts=setupTTDSheet();
if(ts.getLastRow()>1){
var td=ts.getRange(2,1,ts.getLastRow()-1,21).getValues(), st=[];
for(var j=0;j<td.length;j++){
var cur=String(td[j][17]||'');
if(ids[String(td[j][4]||'')]&&cur!=='DICABUT'){ st.push(['DICABUT']); cabut++; } else st.push([cur]);
}
ts.getRange(2,18,st.length,1).setValues(st);
}
}catch(e){}
var rows=r.rows.slice().sort(function(a,b){ return b.row-a.row; });
for(var k=0;k<rows.length;k++) r.sheet.deleteRow(rows[k].row);
writeLog(actorNip,'TPP','Hapus Data Terpilih','Tahun '+opts.tahun,
rows.length+' baris • file '+trashed+' • TTD '+cabut+' • '+nama.join('; '));
return {success:true,deleted:rows.length,trashed:trashed,cabut:cabut,contoh:nama,
message:rows.length+' data dihapus. '+trashed+' file dipindah ke Trash, '+cabut+' tanda tangan elektronik dicabut.'};
}catch(e){ Logger.log('hapusTPPTerpilih: '+e); return {success:false,message:'Error: '+e.message}; }
}

// kompatibilitas tombol lama
function deleteTPPPeriode(skpd,year,month,actorNip){
return hapusTPPTerpilih({skpd:[skpd],tahun:year,bulan:[month]},actorNip);
}
function deleteTPPPeriodeBulk(year,month,actorNip){
return hapusTPPTerpilih({skpd:'ALL',tahun:year,bulan:[month]},actorNip);
}