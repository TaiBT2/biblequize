package com.biblequiz.controller;

import com.biblequiz.entity.Book;
import com.biblequiz.entity.Question;
import com.biblequiz.entity.User;
import com.biblequiz.repository.BookRepository;
import com.biblequiz.repository.QuestionRepository;
import com.biblequiz.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class DataInitController {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/init-data")
    public ResponseEntity<Map<String, Object>> initData() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. Tạo 66 sách Kinh Thánh
            List<Book> books = createBibleBooks();
            bookRepository.saveAll(books);
            result.put("books_created", books.size());

            // 2. Tạo 10 user mẫu
            List<User> users = createSampleUsers();
            userRepository.saveAll(users);
            result.put("users_created", users.size());

            // 3. Tạo 20 câu hỏi cho mỗi sách
            List<Question> questions = createSampleQuestions(books, users.get(0));
            questionRepository.saveAll(questions);
            result.put("questions_created", questions.size());

            result.put("success", true);
            result.put("message", "Dữ liệu mẫu đã được khởi tạo thành công!");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi khi khởi tạo dữ liệu: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/data-status")
    public ResponseEntity<Map<String, Object>> getDataStatus() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            long bookCount = bookRepository.count();
            long userCount = userRepository.count();
            long questionCount = questionRepository.count();
            
            result.put("books_count", bookCount);
            result.put("users_count", userCount);
            result.put("questions_count", questionCount);
            result.put("success", true);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi khi lấy thông tin dữ liệu: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @DeleteMapping("/clear-data")
    public ResponseEntity<Map<String, Object>> clearData() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Xóa tất cả dữ liệu (cẩn thận với foreign key constraints)
            questionRepository.deleteAll();
            bookRepository.deleteAll();
            userRepository.deleteAll();
            
            result.put("success", true);
            result.put("message", "Dữ liệu đã được xóa thành công! Khởi động lại ứng dụng để tạo dữ liệu mới.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi khi xóa dữ liệu: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/reset-data")
    public ResponseEntity<Map<String, Object>> resetData() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Xóa dữ liệu cũ
            questionRepository.deleteAll();
            bookRepository.deleteAll();
            userRepository.deleteAll();
            
            // Tạo lại dữ liệu mới
            List<Book> books = createBibleBooks();
            bookRepository.saveAll(books);
            
            List<User> users = createSampleUsers();
            userRepository.saveAll(users);
            
            List<Question> questions = createSampleQuestions(books, users.get(0));
            questionRepository.saveAll(questions);
            
            result.put("success", true);
            result.put("message", "Dữ liệu đã được reset thành công!");
            result.put("books_created", books.size());
            result.put("users_created", users.size());
            result.put("questions_created", questions.size());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi khi reset dữ liệu: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    private List<Book> createBibleBooks() {
        List<Book> books = new ArrayList<>();
        
        // Cựu Ước (39 sách)
        String[][] oldTestamentBooks = {
            {"Genesis", "Sáng Thế Ký", "1"},
            {"Exodus", "Xuất Ê-díp-tô Ký", "2"},
            {"Leviticus", "Lê-vi Ký", "3"},
            {"Numbers", "Dân Số Ký", "4"},
            {"Deuteronomy", "Phục Truyền Luật Lệ Ký", "5"},
            {"Joshua", "Giô-suê", "6"},
            {"Judges", "Các Quan Xét", "7"},
            {"Ruth", "Ru-tơ", "8"},
            {"1 Samuel", "1 Sa-mu-ên", "9"},
            {"2 Samuel", "2 Sa-mu-ên", "10"},
            {"1 Kings", "1 Các Vua", "11"},
            {"2 Kings", "2 Các Vua", "12"},
            {"1 Chronicles", "1 Sử Ký", "13"},
            {"2 Chronicles", "2 Sử Ký", "14"},
            {"Ezra", "Ê-xơ-ra", "15"},
            {"Nehemiah", "Nê-hê-mi", "16"},
            {"Esther", "Ê-xơ-tê", "17"},
            {"Job", "Gióp", "18"},
            {"Psalms", "Thi Thiên", "19"},
            {"Proverbs", "Châm Ngôn", "20"},
            {"Ecclesiastes", "Truyền Đạo", "21"},
            {"Song of Songs", "Nhã Ca", "22"},
            {"Isaiah", "Ê-sai", "23"},
            {"Jeremiah", "Giê-rê-mi", "24"},
            {"Lamentations", "Ca Thương", "25"},
            {"Ezekiel", "Ê-xê-chi-ên", "26"},
            {"Daniel", "Đa-ni-ên", "27"},
            {"Hosea", "Ô-sê", "28"},
            {"Joel", "Giô-ên", "29"},
            {"Amos", "A-mốt", "30"},
            {"Obadiah", "Áp-đia", "31"},
            {"Jonah", "Giô-na", "32"},
            {"Micah", "Mi-chê", "33"},
            {"Nahum", "Na-hum", "34"},
            {"Habakkuk", "Ha-ba-cúc", "35"},
            {"Zephaniah", "Sô-phô-ni", "36"},
            {"Haggai", "A-ghê", "37"},
            {"Zechariah", "Xa-cha-ri", "38"},
            {"Malachi", "Ma-la-chi", "39"}
        };

        for (String[] book : oldTestamentBooks) {
            Book b = new Book();
            b.setId(UUID.randomUUID().toString());
            b.setName(book[0]);
            b.setNameVi(book[1]);
            b.setTestament(Book.Testament.OLD);
            b.setOrderIndex(Integer.parseInt(book[2]));
            books.add(b);
        }

        // Tân Ước (27 sách)
        String[][] newTestamentBooks = {
            {"Matthew", "Ma-thi-ơ", "40"},
            {"Mark", "Mác", "41"},
            {"Luke", "Lu-ca", "42"},
            {"John", "Giăng", "43"},
            {"Acts", "Công Vụ", "44"},
            {"Romans", "Rô-ma", "45"},
            {"1 Corinthians", "1 Cô-rinh-tô", "46"},
            {"2 Corinthians", "2 Cô-rinh-tô", "47"},
            {"Galatians", "Ga-la-ti", "48"},
            {"Ephesians", "Ê-phê-sô", "49"},
            {"Philippians", "Phi-líp", "50"},
            {"Colossians", "Cô-lô-se", "51"},
            {"1 Thessalonians", "1 Tê-sa-lô-ni-ca", "52"},
            {"2 Thessalonians", "2 Tê-sa-lô-ni-ca", "53"},
            {"1 Timothy", "1 Ti-mô-thê", "54"},
            {"2 Timothy", "2 Ti-mô-thê", "55"},
            {"Titus", "Tít", "56"},
            {"Philemon", "Phi-lê-môn", "57"},
            {"Hebrews", "Hê-bơ-rơ", "58"},
            {"James", "Gia-cơ", "59"},
            {"1 Peter", "1 Phi-e-rơ", "60"},
            {"2 Peter", "2 Phi-e-rơ", "61"},
            {"1 John", "1 Giăng", "62"},
            {"2 John", "2 Giăng", "63"},
            {"3 John", "3 Giăng", "64"},
            {"Jude", "Giu-đe", "65"},
            {"Revelation", "Khải Huyền", "66"}
        };

        for (String[] book : newTestamentBooks) {
            Book b = new Book();
            b.setId(UUID.randomUUID().toString());
            b.setName(book[0]);
            b.setNameVi(book[1]);
            b.setTestament(Book.Testament.NEW);
            b.setOrderIndex(Integer.parseInt(book[2]));
            books.add(b);
        }

        return books;
    }

    private List<User> createSampleUsers() {
        List<User> users = new ArrayList<>();
        
        String[][] userData = {
            {"Nguyễn Văn An", "an.nguyen@example.com"},
            {"Trần Thị Bình", "binh.tran@example.com"},
            {"Lê Văn Cường", "cuong.le@example.com"},
            {"Phạm Thị Dung", "dung.pham@example.com"},
            {"Hoàng Văn Em", "em.hoang@example.com"},
            {"Vũ Thị Phương", "phuong.vu@example.com"},
            {"Đặng Văn Giang", "giang.dang@example.com"},
            {"Bùi Thị Hoa", "hoa.bui@example.com"},
            {"Ngô Văn Ích", "ich.ngo@example.com"},
            {"Đinh Thị Kim", "kim.dinh@example.com"}
        };

        for (String[] user : userData) {
            User u = new User();
            u.setId(UUID.randomUUID().toString());
            u.setName(user[0]);
            u.setEmail(user[1]);
            u.setProvider("local");
            u.setRole("USER");
            users.add(u);
        }

        return users;
    }

    private List<Question> createSampleQuestions(List<Book> books, User createdBy) {
        List<Question> questions = new ArrayList<>();
        
        String[] questionTemplates = {
            "Sách {book} có bao nhiêu chương?",
            "Trong sách {book}, chương {chapter} nói về điều gì?",
            "Ai là tác giả của sách {book}?",
            "Sách {book} thuộc về Cựu Ước hay Tân Ước?",
            "Câu chuyện nào nổi tiếng nhất trong sách {book}?",
            "Sách {book} được viết vào khoảng thời gian nào?",
            "Nhân vật chính trong sách {book} là ai?",
            "Sách {book} có bao nhiều câu?",
            "Thông điệp chính của sách {book} là gì?",
            "Sách {book} được viết bằng ngôn ngữ gì?",
            "Sách {book} có bao nhiều phần chính?",
            "Tên gốc của sách {book} là gì?",
            "Sách {book} được đọc trong dịp lễ nào?",
            "Sách {book} có liên quan đến sách nào khác?",
            "Sách {book} được dịch sang tiếng Việt khi nào?",
            "Sách {book} có bao nhiều chủ đề chính?",
            "Sách {book} được sử dụng trong nghi lễ nào?",
            "Sách {book} có ảnh hưởng như thế nào đến đời sống?",
            "Sách {book} được bảo tồn như thế nào?",
            "Sách {book} có ý nghĩa gì đặc biệt?"
        };

        String[][] answerOptions = {
            {"1-5 chương", "6-10 chương", "11-15 chương", "16-20 chương"},
            {"Sự sáng tạo", "Lịch sử dân tộc", "Luật pháp", "Lời tiên tri"},
            {"Môi-se", "Đa-vít", "Sa-lô-môn", "Các sứ đồ"},
            {"Cựu Ước", "Tân Ước", "Cả hai", "Không xác định"},
            {"Sự sáng tạo", "Hồng thủy", "Xuất Ai Cập", "Chúa Giê-su"},
            {"2000-1500 TCN", "1500-1000 TCN", "1000-500 TCN", "500 TCN-100 SCN"},
            {"A-đam", "Nô-ê", "Áp-ra-ham", "Môi-se"},
            {"Dưới 100", "100-500", "500-1000", "Trên 1000"},
            {"Tình yêu", "Công lý", "Hy vọng", "Hòa bình"},
            {"Hê-bơ-rơ", "A-ram", "Hy Lạp", "La-tinh"}
        };

        for (Book book : books) {
            for (int i = 0; i < 20; i++) {
                Question question = new Question();
                question.setId(UUID.randomUUID().toString());
                question.setBook(book.getName());
                question.setChapter(1 + (i % 5)); // Chương 1-5
                question.setVerseStart(1 + (i % 10)); // Câu 1-10
                question.setVerseEnd(question.getVerseStart() + (i % 3)); // 1-3 câu
                
                // Phân bố độ khó
                if (i < 7) {
                    question.setDifficulty(Question.Difficulty.easy);
                } else if (i < 14) {
                    question.setDifficulty(Question.Difficulty.medium);
                } else {
                    question.setDifficulty(Question.Difficulty.hard);
                }
                
                question.setType(Question.Type.multiple_choice_single);
                
                // Tạo nội dung câu hỏi
                String template = questionTemplates[i % questionTemplates.length];
                String content = template.replace("{book}", book.getNameVi())
                                       .replace("{chapter}", String.valueOf(question.getChapter()));
                question.setContent(content);
                
                // Tạo đáp án
                String[] options = answerOptions[i % answerOptions.length];
                question.setOptions(Arrays.asList(options));
                
                // Đáp án đúng (ngẫu nhiên)
                List<Integer> correctAnswer = Arrays.asList(i % 4);
                question.setCorrectAnswer(correctAnswer);
                
                question.setExplanation("Đây là câu hỏi mẫu về sách " + book.getNameVi() + ".");
                question.setTags("[\"mẫu\", \"" + book.getName() + "\"]");
                question.setSource("Hệ thống tạo câu hỏi mẫu");
                question.setLanguage("vi");
                question.setIsActive(true);
                question.setCreatedBy(createdBy);
                
                questions.add(question);
            }
        }

        return questions;
    }
}
