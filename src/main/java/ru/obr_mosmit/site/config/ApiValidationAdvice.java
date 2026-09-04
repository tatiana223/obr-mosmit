package ru.obr_mosmit.site.config;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiValidationAdvice {

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    ResponseEntity<String> handleValidation(Exception exception) {
        var bindingResult = exception instanceof MethodArgumentNotValidException manve
                ? manve.getBindingResult()
                : ((BindException) exception).getBindingResult();
        String message = bindingResult.getFieldErrors().stream()
                .map(error -> error.getDefaultMessage() == null || error.getDefaultMessage().isBlank()
                        ? error.getField()
                        : error.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining(". "));
        if (message.isBlank()) {
            message = "Проверьте заполнение формы";
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<String> handleStatus(ResponseStatusException exception) {
        String message = exception.getReason() == null || exception.getReason().isBlank()
                ? "Запрос не выполнен"
                : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode()).body(message);
    }

    @ExceptionHandler({MaxUploadSizeExceededException.class, MultipartException.class})
    ResponseEntity<String> handleUploadTooLarge(Exception exception) {
        Throwable cause = exception;
        while (cause != null) {
            if (cause instanceof MaxUploadSizeExceededException) {
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                        .body("Изображение слишком большое. Максимум 10 МБ — уменьшите файл и попробуйте снова.");
            }
            cause = cause.getCause();
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Не удалось загрузить файл. Проверьте размер изображения (до 10 МБ) и формат.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<String> handleBadArgument(IllegalArgumentException exception) {
        String message = exception.getMessage() == null || exception.getMessage().isBlank()
                ? "Некорректный запрос"
                : exception.getMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }
}
