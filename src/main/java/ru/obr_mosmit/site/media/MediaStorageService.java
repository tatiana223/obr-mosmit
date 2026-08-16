package ru.obr_mosmit.site.media;
import java.io.IOException;import java.nio.file.*;import java.util.*;import org.springframework.beans.factory.annotation.Value;import org.springframework.stereotype.Service;import org.springframework.web.multipart.MultipartFile;
@Service public class MediaStorageService{
 private final Path directory;public MediaStorageService(@Value("${app.uploads.directory}")String d){directory=Path.of(d).toAbsolutePath().normalize();}
 public String store(MultipartFile file){if(file==null||file.isEmpty()||file.getContentType()==null||!file.getContentType().startsWith("image/"))throw new IllegalArgumentException("Можно загружать только изображения");if(file.getSize()>10*1024*1024)throw new IllegalArgumentException("Изображение больше 10 МБ");return save(file,"image.jpg");}
 public String storeDocument(MultipartFile file){if(file==null||file.isEmpty())throw new IllegalArgumentException("Файл пуст");if(file.getSize()>25*1024*1024)throw new IllegalArgumentException("Файл больше 25 МБ");return save(file,"document.pdf");}
 private String save(MultipartFile file,String fallback){String original=Objects.requireNonNullElse(file.getOriginalFilename(),fallback);String ext=original.contains(".")?original.substring(original.lastIndexOf('.')).toLowerCase():"";try{Files.createDirectories(directory);String name=UUID.randomUUID()+ext;file.transferTo(directory.resolve(name));return "/uploads/"+name;}catch(IOException e){throw new IllegalStateException("Не удалось сохранить файл",e);}}
}
