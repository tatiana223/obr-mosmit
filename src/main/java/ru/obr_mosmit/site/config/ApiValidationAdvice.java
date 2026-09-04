package ru.obr_mosmit.site.config;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiValidationAdvice {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<String> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
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
}
