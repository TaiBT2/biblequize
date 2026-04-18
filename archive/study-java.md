# Roadmap Học Java cho Vibe Coding

> **Mục tiêu:** Đọc hiểu code Java + Spring Boot đủ để debug, review code do AI sinh ra, và sửa lỗi nhanh. **Không** nhằm mục tiêu tự viết app từ đầu.
>
> **Đối tượng:** DevOps engineer đã quen nhiều ngôn ngữ, đang làm BibleQuiz (Spring Boot 3.3 + Java 17).
>
> **Thời lượng:** ~2 tuần, mỗi ngày 1h. Có thể nén lại 1 tuần nếu học full-time.

---

## Nguyên tắc học

1. **80/20**: Học phần lõi đủ để đọc, không học cho thi cử.
2. **Đọc trước, viết sau**: Mở repo BibleQuiz, đọc code thật song song với lý thuyết.
3. **Học qua lỗi**: Mỗi khi gặp stack trace, dừng lại tra cứu thay vì copy-paste cho AI ngay.
4. **Dùng IntelliJ IDEA Community** (miễn phí): hover xem type, Ctrl+Click jump-to-definition, auto-import — đỡ 70% công sức nhớ syntax.

---

## Phase 1 — Nền tảng cú pháp (Ngày 1-2)

### Cần nắm
- **Kiểu dữ liệu**: `int`, `long`, `double`, `boolean`, `char`, `String`
- **Wrapper types**: `Integer`, `Long`, `Boolean` — khác gì primitive, khi nào null
- **`var`** (Java 10+): type inference cho biến local
- **Class, object, constructor**: `new MyClass()`
- **Method**: signature, return type, parameter, overload
- **`this`, `super`**
- **Access modifier**: `public`, `private`, `protected`, package-private (mặc định)
- **Control flow**: `if/else`, `for`, enhanced for (`for (var x : list)`), `while`, `switch` (kể cả switch expression mới)
- **Package & import**

### Bỏ qua
- Bitwise operator, label, `goto` (Java không có), số phức tạp về bit shifting

### Bài tập
- Mở 1 file `Entity` trong BibleQuiz, đọc và giải thích từng dòng cho chính mình.

---

## Phase 2 — OOP cơ bản (Ngày 3-4)

### Cần nắm
- **Inheritance**: `extends`, override, `@Override`
- **Interface**: `implements`, `default` method, `static` method trong interface
- **Abstract class** vs interface — khi nào dùng cái nào
- **`final`**: final class, final method, final variable
- **`static`**: static field, static method, static block
- **`enum`** — Java enum mạnh hơn nhiều ngôn ngữ khác, có thể có method
- **Generics đọc hiểu**: `List<String>`, `Map<UUID, User>`, `Repository<T, ID>`
  - Chỉ cần đọc, chưa cần tự viết generic class
- **Collections cơ bản**: `List`, `ArrayList`, `Map`, `HashMap`, `Set`, `HashSet`
- **`Optional<T>`**: `of`, `empty`, `orElse`, `orElseThrow`, `ifPresent`, `map`

### Bỏ qua
- Bounded generics phức tạp (`<T extends Comparable<? super T>>`)
- Reflection sâu
- Custom annotation processor

---

## Phase 3 — Modern Java (Ngày 5-6)

Phần này là cái xuất hiện **nhiều nhất** trong code Spring Boot hiện đại.

### Lambda & Functional Interface
```java
// Lambda
users.stream().filter(u -> u.isActive()).toList();

// Method reference
users.stream().map(User::getName).toList();

// Functional interface phổ biến
Function<String, Integer> len = s -> s.length();
Predicate<User> isAdult = u -> u.getAge() >= 18;
Consumer<String> printer = System.out::println;
Supplier<UUID> idGen = UUID::randomUUID;
```

### Stream API
- `filter`, `map`, `flatMap`, `distinct`, `sorted`, `limit`
- Terminal: `toList()`, `collect(Collectors.toMap(...))`, `count()`, `findFirst()`, `anyMatch()`
- **Lưu ý**: stream chỉ dùng được 1 lần, không reuse

### Record (Java 14+)
```java
public record UserDto(String name, int age) {}
// Tự sinh constructor, getter (name(), age()), equals, hashCode, toString
```
BibleQuiz dùng record cho DTO — quan trọng phải hiểu.

### Exception handling
- `try/catch/finally`, multi-catch (`catch (IOException | SQLException e)`)
- `try-with-resources`: `try (var conn = ds.getConnection()) { ... }`
- **Checked vs unchecked**: `RuntimeException` và con cháu là unchecked
- `throws` trong method signature
- Custom exception: `extends RuntimeException`

### Khác
- **Text block**: `"""..."""` cho string nhiều dòng
- **`sealed` class** (chưa cần sâu, biết tồn tại là đủ)

---

## Phase 4 — Spring Boot Idioms (Ngày 7-10) ⭐ Quan trọng nhất

### Dependency Injection
```java
@Service
@RequiredArgsConstructor  // Lombok sinh constructor
public class QuizService {
    private final QuizRepository quizRepository;  // constructor injection
    private final UserMapper userMapper;
}
```
- **Constructor injection** là chuẩn hiện nay (không dùng `@Autowired` field nữa)
- `@Service`, `@Repository`, `@Component`, `@Configuration`, `@Bean` — phân biệt khi nào dùng

### REST Controller
```java
@RestController
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/{id}")
    public QuizDto getById(@PathVariable UUID id) { ... }

    @PostMapping
    public QuizDto create(@RequestBody @Valid CreateQuizRequest req) { ... }

    @GetMapping
    public Page<QuizDto> list(@RequestParam(defaultValue = "0") int page) { ... }
}
```
Cần thuộc: `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`, `@PathVariable`, `@RequestParam`, `@RequestBody`, `@RequestHeader`, `@Valid`.

### JPA / Hibernate
```java
@Entity
@Table(name = "quizzes")
@Getter @Setter
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    private List<Question> questions;
}
```
- `@Entity`, `@Table`, `@Id`, `@Column`, `@GeneratedValue`
- Quan hệ: `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`, `@JoinColumn`
- **`FetchType.LAZY` vs `EAGER`** — nguyên nhân của 90% bug `LazyInitializationException`
- `JpaRepository<Quiz, UUID>` — biết sẵn các method `findById`, `save`, `findAll`, `deleteById`
- Custom query: `@Query("SELECT q FROM Quiz q WHERE ...")`

### Transaction
- `@Transactional` ở method service — biết khi nào cần
- `@Transactional(readOnly = true)` cho query
- Rollback chỉ tự động với unchecked exception

### Configuration
```yaml
# application.yml
biblequiz:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 3600
```
```java
@ConfigurationProperties(prefix = "biblequiz.jwt")
public record JwtProperties(String secret, long expiration) {}

// hoặc
@Value("${biblequiz.jwt.secret}")
private String secret;
```

### Validation
- `@Valid`, `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Min`, `@Max`, `@Pattern`

### Lombok (BibleQuiz dùng nhiều)
- `@Getter`, `@Setter`, `@RequiredArgsConstructor`, `@AllArgsConstructor`, `@NoArgsConstructor`
- `@Slf4j` — sinh `log` field cho logging
- `@Builder` — builder pattern
- **Lưu ý**: cần plugin Lombok trong IDE

### MapStruct (BibleQuiz convention)
```java
@Mapper(componentModel = "spring")
public interface QuizMapper {
    QuizDto toDto(Quiz entity);
    Quiz toEntity(CreateQuizRequest req);
}
```
Tự sinh implement lúc compile, tránh viết tay mapping.

---

## Phase 5 — Đọc Stack Trace (xuyên suốt) ⭐⭐

Đây là kỹ năng **quan trọng nhất** với mục tiêu vibe coding của bạn.

### Quy tắc đọc
1. **Dòng đầu** = loại exception + message → đọc kỹ message trước
2. **Caused by** ở cuối thường là root cause thật → nhảy xuống đọc trước
3. Tìm **dòng đầu tiên có package của bạn** (`vn.biblequiz.xxx`) — đó là chỗ code bạn gây lỗi
4. Bỏ qua các dòng `org.springframework.*`, `java.base/*`, `sun.*` — đó là framework

### Exception hay gặp
| Exception | Nguyên nhân điển hình |
|---|---|
| `NullPointerException` | Gọi method trên object `null`. Java 17 báo rõ field nào null. |
| `LazyInitializationException` | Truy cập lazy collection ngoài transaction |
| `DataIntegrityViolationException` | Vi phạm constraint DB (unique, FK, not null) |
| `ConstraintViolationException` | `@Valid` fail |
| `MethodArgumentNotValidException` | Request body fail validation |
| `HttpMessageNotReadableException` | JSON request sai format |
| `NoSuchElementException` | `Optional.get()` trên empty optional |
| `ClassCastException` | Ép kiểu sai |
| `StackOverflowError` | Đệ quy vô hạn (thường do `toString()` 2 entity tham chiếu nhau) |
| `BeanCreationException` | Spring không inject được bean — đọc `Caused by` |
| `NoUniqueBeanDefinitionException` | Có nhiều bean cùng type, cần `@Qualifier` |

### Workflow debug khi vibe coding
1. Đọc dòng đầu + `Caused by` cuối
2. Tự đoán nguyên nhân trong 30 giây
3. Nếu không ra → paste full stack trace cho Claude **kèm** đoạn code liên quan
4. Sau khi fix, **đọc lại** giải thích của Claude để học

---

## Tài liệu đề xuất

### Video (chọn 1)
- **Mosh Hamedani** — "Java Tutorial for Beginners" (YouTube, ~2.5h) — nhanh, gọn
- **Amigoscode** — "Spring Boot Tutorial for Beginners" — cho phần Spring

### Đọc
- **Baeldung.com** — search bất kỳ topic Spring/Java nào, chất lượng top
- **Spring Boot Reference Documentation** — phần "Getting Started" và "Web"
- **Java Records** — bài blog của Oracle

### Cheat sheet
- Spring annotations cheat sheet (search Google)
- JPA annotations cheat sheet

### Sách (nếu muốn sâu hơn sau này)
- *Effective Java* (Joshua Bloch) — kinh điển, đọc sau khi đã quen
- *Spring in Action* (Craig Walls) — dày nhưng đầy đủ

---

## Checklist tự đánh giá

Sau 2 tuần, bạn nên trả lời được:

- [ ] Đọc 1 file Entity và giải thích từng annotation
- [ ] Đọc 1 Controller và biết endpoint nào nhận gì, trả gì
- [ ] Phân biệt `@Service` vs `@Component` vs `@Repository`
- [ ] Giải thích sự khác nhau giữa constructor injection và field injection
- [ ] Biết khi nào cần `@Transactional`
- [ ] Đọc stack trace `LazyInitializationException` và biết cách fix
- [ ] Hiểu lambda và stream cơ bản
- [ ] Biết Optional dùng để làm gì, tránh `.get()` mù
- [ ] Đọc được file `application.yml` và biết config nào bind vào class nào
- [ ] Sửa được lỗi compile đơn giản mà không cần hỏi AI

---

## Lời khuyên cuối

- **Không học để nhớ syntax** — IDE lo. Học để **hiểu khái niệm**.
- **Mỗi ngày dành 15 phút đọc code BibleQuiz hiện tại** — học từ codebase thật hiệu quả hơn tutorial.
- **Khi AI sinh code, đừng merge ngay** — đọc lướt, hiểu ý đồ, mới merge. Đây mới là "vibe coding có trách nhiệm".
- **Ghi log những lỗi đã gặp** vào 1 file riêng — sau 1 tháng bạn sẽ có cheat sheet riêng cực giá trị.