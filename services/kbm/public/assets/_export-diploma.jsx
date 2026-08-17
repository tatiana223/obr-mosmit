#target photoshop
app.displayDialogs = DialogModes.NO;
var src = new File("c:/Users/my200/YandexDisk/1. МИТРОПОЛИЯ/7. ОРГАНИЗАЦИОННО-ТЕХНИЧЕСКИЙ/ДИПЛОМ МЕЖЪЕП. ОТДЕЛА/Шаблоны/Диплом образец.psd");
var outFile = new File("C:/Users/my200/КБМ/public/assets/certificate-bg.jpg");
if(!src.exists){ throw new Error("source missing"); }
app.open(src);
var doc = app.activeDocument;
// Flatten copy for export
var opts = new JPEGSaveOptions();
opts.quality = 10;
opts.embedColorProfile = true;
opts.formatOptions = FormatOptions.STANDARDBASELINE;
doc.saveAs(outFile, opts, true);
doc.close(SaveOptions.DONOTSAVECHANGES);
app.quit();
