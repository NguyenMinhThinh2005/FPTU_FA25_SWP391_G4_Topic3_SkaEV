# GIẢ ĐỊNH, RỦI RO & CÂU HỎI MỞ

## 1. DANH SÁCH GIẢ ĐỊNH (Assumptions)

### 1.1 Giả định về Dữ liệu

| #   | Giả định                                             | Căn cứ                                                   | Phương án xác minh                               | Rủi ro                                |
| --- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| A1  | Mock data đại diện đầy đủ cho production data        | mockData.js có đầy đủ các trường, có validated structure | Review với Product Owner về các trường còn thiếu | 🟡 Medium - Có thể thiếu fields       |
| A2  | Connector types cố định: Type 2, CCS2, CHAdeMO       | constants.js:56-60, mockData.js                          | Hỏi team hardware về chuẩn connector tương lai   | 🟢 Low - Enum có thể mở rộng          |
| A3  | Pricing chỉ phân theo AC/DC/DC Fast/DC Ultra         | mockData.js:236-241                                      | Confirm pricing strategy với Finance             | 🟡 Medium - Có thể có dynamic pricing |
| A4  | Một customer chỉ có một default vehicle              | vehicleStore.js:78-87                                    | Business logic validation                        | 🟢 Low - Có constraint                |
| A5  | QR code format: `SKAEV:STATION:{stationId}:{slotId}` | mockAPI.js:637-642                                       | Confirm với QR generation team                   | 🟡 Medium - Format có thể thay đổi    |
| A6  | SOC updates mỗi 3 giây                               | mockAPI.js:463                                           | Performance testing với actual hardware          | 🟡 Medium - Có thể quá nhanh/chậm     |
| A7  | Tax cố định 10% (VAT Vietnam)                        | invoiceService.js:12                                     | Confirm với Legal/Finance                        | 🟢 Low - Chuẩn VAT VN                 |
| A8  | Parking fee tính theo giờ, làm tròn lên              | invoiceService.js:25                                     | Business rules validation                        | 🟢 Low - Có trong mock                |
| A9  | Email verified = FALSE mặc định                      | users table schema                                       | Confirm email verification flow                  | 🟢 Low - Standard practice            |
| A10 | Soft delete (is_active flag) thay vì hard delete     | users.is_active, slot.status                             | Data retention policy                            | 🟢 Low - Best practice                |

---

### 1.2 Giả định về Luồng Nghiệp vụ

| #   | Giả định                                                           | Căn cứ                                  | Phương án xác minh         | Rủi ro                            |
| --- | ------------------------------------------------------------------ | --------------------------------------- | -------------------------- | --------------------------------- |
| B1  | Booking flow: pending → confirmed (QR scan) → charging → completed | bookingStore.js:58-67                   | UAT với users              | 🟢 Low - Có implement             |
| B2  | Phải scan QR trước khi start charging                              | bookingStore.js:145-160                 | Business requirement doc   | 🟢 Low - Constraint có            |
| B3  | SOC tracking chỉ có cho active charging sessions                   | soc_tracking.status enum                | Clarify với Product        | 🟡 Medium - Có thể cần history    |
| B4  | Invoice tự động generate khi booking completed                     | invoiceService.js:42-76                 | Backend trigger logic      | 🟢 Low - Standard flow            |
| B5  | Notification không expire (no TTL)                                 | notifications table                     | Clarify retention policy   | 🟡 Medium - DB có thể bloat       |
| B6  | Station owner_id có thể là 'system' hoặc user UUID                 | mockData.js:132                         | Multi-tenant architecture  | 🟡 Medium - Cần clarify B2B model |
| B7  | Operating hours NULL = 24/7                                        | mockData.js:339-342                     | Business validation        | 🟢 Low - Có trong mock            |
| B8  | Một booking chỉ assign 1 slot                                      | bookings.slot_id FK                     | Hardware constraint        | 🟢 Low - Physical limitation      |
| B9  | Payment method có thể NULL (pay later)                             | bookings.payment_method nullable        | Payment flow clarification | 🟡 Medium - Risk: unpaid bookings |
| B10 | Cancellation phải có reason                                        | bookings.cancellation_reason constraint | UX requirement             | 🟢 Low - Có constraint            |

---

### 1.3 Giả định về Kỹ thuật

| #   | Giả định                                        | Căn cứ                      | Phương án xác minh                    | Rủi ro                            |
| --- | ----------------------------------------------- | --------------------------- | ------------------------------------- | --------------------------------- |
| C1  | PostgreSQL 16 là database choice                | Requirement                 | Confirm infra team                    | 🟢 Low - Modern choice            |
| C2  | Geospatial queries dùng PostGIS                 | Nearby search requirement   | Test performance                      | 🟢 Low - Industry standard        |
| C3  | UUID cho primary keys (không auto-increment)    | mockData.js ID format       | Discuss distributed system plan       | 🟡 Medium - Performance trade-off |
| C4  | JSONB cho arrays (connector_types, permissions) | Flexible schema             | Performance test với large data       | 🟡 Medium - Index overhead        |
| C5  | bcrypt cho password hashing (10 rounds)         | Security best practice      | Security audit                        | 🟢 Low - Standard                 |
| C6  | WebSocket cho real-time updates                 | SOC tracking, notifications | Load test 1000 concurrent connections | 🔴 High - Scalability concern     |
| C7  | No multi-tenancy isolation (single schema)      | owner_id field              | Clarify B2B model                     | 🟡 Medium - May need RLS          |
| C8  | No database sharding (single instance)          | Initial phase               | Scalability plan                      | 🟡 Medium - Future growth         |
| C9  | Read replicas không cần thiết ban đầu           | Small user base assumption  | Monitor read/write ratio              | 🟢 Low - Can add later            |
| C10 | Connection pooling ở application layer          | Standard architecture       | Configure pool size                   | 🟢 Low - Standard                 |

---

## 2. RỦI RO ĐÁNH GIÁ (Risk Assessment)

### 🔴 High Priority Risks

#### R1: Real-time SOC Updates Scalability

**Mô tả:** SOC updates mỗi 3 giây cho 1000+ concurrent charging sessions có thể overload database  
**Impact:** Database crash, data loss  
**Likelihood:** High nếu không optimize  
**Mitigation:**

- [ ] Implement Redis cache layer cho SOC data
- [ ] Batch insert SOC history (buffer 10 updates → 1 INSERT)
- [ ] Partition soc_charging_history by timestamp (daily)
- [ ] Use TimescaleDB extension cho time-series optimization

#### R2: Payment Security & PCI Compliance

**Mô tả:** Storing payment method details có thể vi phạm PCI-DSS  
**Impact:** Legal issues, data breach  
**Likelihood:** High nếu không encrypt  
**Mitigation:**

- [ ] Tokenize card numbers (use Stripe/PayOS tokens, không lưu real card)
- [ ] Encrypt sensitive fields (pgcrypto)
- [ ] Audit log all payment operations
- [ ] Regular security audit

#### R3: Geospatial Query Performance

**Mô tả:** PostGIS nearby search có thể chậm với 10,000+ stations  
**Impact:** Poor UX, slow station search  
**Likelihood:** Medium  
**Mitigation:**

- [ ] GiST index on latitude/longitude ✅ (đã có)
- [ ] Pre-calculate distance buckets (5km, 10km, 20km)
- [ ] Cache popular search areas
- [ ] Consider ElasticSearch cho full-text + geo search

---

### 🟡 Medium Priority Risks

#### R4: Mock Data Không Đầy Đủ

**Mô tả:** Mock data có thể thiếu fields cần thiết cho production  
**Impact:** Schema changes sau deployment  
**Likelihood:** Medium  
**Mitigation:**

- [ ] Review với Product Owner tất cả features planned
- [ ] UAT với stakeholders
- [ ] Flexible JSONB columns cho future extensions

#### R5: Notification Bloat

**Mô tả:** Notifications table grows unbounded (no TTL)  
**Impact:** Database bloat, slow queries  
**Likelihood:** High  
**Mitigation:**

- [ ] Implement TTL policy (delete after 90 days)
- [ ] Partition notifications by timestamp (monthly)
- [ ] Archive old notifications to S3/cold storage

#### R6: Concurrent Booking Conflicts

**Mô tả:** Race condition khi 2 users book cùng 1 slot  
**Impact:** Double booking, angry customers  
**Likelihood:** Medium  
**Mitigation:**

- [ ] Use database transactions with `SELECT FOR UPDATE`
- [ ] Optimistic locking với version column
- [ ] Queue system (Redis Bull) cho booking creation

#### R7: Invoice Number Collisions

**Mô tả:** Auto-generated invoice numbers có thể duplicate  
**Impact:** Accounting errors  
**Likelihood:** Low (có UNIQUE constraint)  
**Mitigation:**

- [ ] Use database sequence: `INV-{YEAR}-{MONTH}-{SEQUENCE}`
- [ ] Retry logic nếu duplicate
- [ ] Monitor invoice generation failures

---

### 🟢 Low Priority Risks

#### R8: Enum Type Extensions

**Mô tả:** Adding new enum values requires ALTER TYPE migration  
**Impact:** Downtime during migration  
**Likelihood:** Low  
**Mitigation:**

- [ ] Use lookup tables thay vì enums cho frequently-changing values
- [ ] Document enum extension process
- [ ] Plan maintenance windows

#### R9: JSONB Query Performance

**Mô tả:** JSONB queries có thể chậm hơn relational columns  
**Impact:** Slow queries  
**Likelihood:** Low (có GIN indexes)  
**Mitigation:**

- [ ] GIN indexes on JSONB columns ✅ (đã có)
- [ ] Monitor query performance
- [ ] Denormalize nếu cần

---

## 3. CÂU HỎI MỞ CẦN LÀM RÕ (Open Questions)

### 🔵 Business Logic

#### Q1: Multi-tenancy Model

**Câu hỏi:** Station owner_id = 'system' vs user UUID - có phải B2B model?  
**Impact:** RLS policies, data isolation, billing  
**Cần hỏi:** Product Owner, Business team  
**Deadline:** Before Phase 1 (Week 1)

#### Q2: Subscription Plans

**Câu hỏi:** Có subscription model không? (monthly unlimited charging, etc.)  
**Impact:** Thêm tables: subscriptions, subscription_plans  
**Cần hỏi:** Business team, Finance  
**Deadline:** Before Phase 4 (Week 4)

#### Q3: Loyalty Points / Rewards

**Câu hỏi:** Có loyalty program không?  
**Impact:** Thêm table: customer_loyalty_points  
**Cần hỏi:** Marketing team  
**Deadline:** Phase 4 or later

#### Q4: Dynamic Pricing

**Câu hỏi:** Giá có thay đổi theo time-of-day, demand không?  
**Impact:** pricing_tiers table cần thêm time_of_day, demand_multiplier  
**Cần hỏi:** Business, Finance  
**Deadline:** Before Phase 2 (Week 2)

#### Q5: Booking Expiration

**Câu hỏi:** Booking pending/scheduled bao lâu thì auto-cancel?  
**Impact:** Background job, status update logic  
**Cần hỏi:** Product Owner  
**Deadline:** Before Phase 2 (Week 2)

---

### 🔵 Technical Architecture

#### Q6: Read Replicas

**Câu hỏi:** Có cần read replicas không? Read/write ratio?  
**Impact:** Infrastructure cost, replication lag  
**Cần hỏi:** DevOps, Backend lead  
**Deadline:** Before deployment (Phase 4)

#### Q7: Caching Strategy

**Câu hỏi:** Redis cho caching gì? (sessions, SOC data, station list?)  
**Impact:** Architecture complexity  
**Cần hỏi:** Backend lead  
**Deadline:** Before Phase 3 (Week 3)

#### Q8: WebSocket vs Server-Sent Events

**Câu hỏi:** WebSocket hay SSE cho real-time updates?  
**Impact:** Client implementation, scaling  
**Cần hỏi:** Frontend lead, Backend lead  
**Deadline:** Before Phase 3 (Week 3)

#### Q9: Background Jobs

**Câu hỏi:** Queue system nào? (Bull, BullMQ, Celery, Sidekiq?)  
**Impact:** Infrastructure, monitoring  
**Cần hỏi:** DevOps, Backend lead  
**Deadline:** Before Phase 2 (Week 2)

#### Q10: CDN for Images

**Câu hỏi:** Station images, avatars lưu đâu? (S3, CloudFront, local?)  
**Impact:** Storage cost, performance  
**Cần hỏi:** DevOps, Backend lead  
**Deadline:** Before Phase 1 (Week 1)

---

### 🔵 Security & Compliance

#### Q11: GDPR / PDPA Compliance

**Câu hỏi:** Có phải comply với GDPR (EU) hoặc PDPA (Singapore/Thailand)?  
**Impact:** Data retention, right to erasure, audit logs  
**Cần hỏi:** Legal team  
**Deadline:** Before deployment

#### Q12: Audit Logging

**Câu hỏi:** Audit logs lưu ở đâu? Separate table? External system?  
**Impact:** Database size, compliance  
**Cần hỏi:** Security team, Legal  
**Deadline:** Before Phase 2 (Week 2)

#### Q13: API Rate Limiting

**Câu hỏi:** Rate limiting per user? Per IP?  
**Impact:** Application layer, Redis  
**Cần hỏi:** Backend lead, Security  
**Deadline:** Before Phase 1 (Week 1)

#### Q14: Database Backup Strategy

**Câu hỏi:** Backup frequency? Point-in-time recovery?  
**Impact:** RTO/RPO, storage cost  
**Cần hỏi:** DevOps, DBA  
**Deadline:** Before deployment

---

### 🔵 Operations & Monitoring

#### Q15: Monitoring Stack

**Câu hỏi:** APM tool? (DataDog, New Relic, Prometheus + Grafana?)  
**Impact:** Cost, observability  
**Cần hỏi:** DevOps  
**Deadline:** Before Phase 4 (Week 4)

#### Q16: Error Tracking

**Câu hỏi:** Sentry? Rollbar? CloudWatch Logs?  
**Impact:** Debugging, alerting  
**Cần hỏi:** DevOps, Backend lead  
**Deadline:** Before Phase 1 (Week 1)

#### Q17: Database Sizing

**Câu hỏi:** Expected user count? Bookings per day?  
**Impact:** Infrastructure sizing, cost  
**Cần hỏi:** Product Owner, Business  
**Deadline:** Before deployment

#### Q18: CI/CD Pipeline

**Câu hỏi:** GitHub Actions? GitLab CI? Jenkins?  
**Impact:** Deployment automation  
**Cần hỏi:** DevOps  
**Deadline:** Before Phase 1 (Week 1)

---

## 4. PHƯƠNG ÁN XÁC MINH (Verification Plan)

### Phase 0: Pre-development (Week 0)

- [ ] **Q1-Q5:** Schedule meeting với Product Owner + Business team
- [ ] **Q6-Q10:** Technical architecture review với tech leads
- [ ] **Q11-Q14:** Security review với Legal + Security team
- [ ] **Q15-Q18:** DevOps planning session

### Phase 1: Schema Validation (Week 1)

- [ ] Review schema với backend team
- [ ] UAT với sample frontend screens
- [ ] Load test schema với synthetic data
- [ ] Security audit của DBA

### Phase 2: API Integration (Week 2-3)

- [ ] Integration test với real API
- [ ] Performance benchmarks
- [ ] Concurrent booking stress test
- [ ] WebSocket load test

### Phase 4: Pre-production (Week 4)

- [ ] Staging deployment
- [ ] Full E2E testing
- [ ] Security penetration test
- [ ] Performance audit

---

## 5. DECISION LOG (Quyết định Thiết kế)

| Date       | Decision                      | Rationale                                           | Approved By        |
| ---------- | ----------------------------- | --------------------------------------------------- | ------------------ |
| 2024-12-26 | Use PostgreSQL 16             | Mature, geospatial support, JSONB, good performance | Architecture team  |
| 2024-12-26 | UUID primary keys             | Distributed-friendly, no collision risk             | Database architect |
| 2024-12-26 | JSONB for arrays              | Flexible schema, good PostgreSQL support            | Backend lead       |
| 2024-12-26 | Enum types over lookup tables | Type safety, performance                            | Database architect |
| 2024-12-26 | Soft delete (is_active flag)  | Data retention, audit trail                         | Product Owner      |
| 2024-12-26 | 10% VAT hard-coded            | Vietnam tax law                                     | Finance team       |
| 2024-12-26 | bcrypt 10 rounds              | Security best practice                              | Security team      |
| 2024-12-26 | Row-level security enabled    | Data isolation                                      | Security team      |
| TBD        | WebSocket vs SSE              | Real-time architecture                              | Backend lead       |
| TBD        | Redis caching strategy        | Performance optimization                            | Backend lead       |

---

## 6. RISK MITIGATION TIMELINE

| Week        | Risk Addressed            | Action Items                |
| ----------- | ------------------------- | --------------------------- |
| Week 1      | R4 (Mock data incomplete) | UAT with Product Owner      |
| Week 2      | R6 (Concurrent bookings)  | Implement transaction locks |
| Week 2      | R7 (Invoice collisions)   | Sequence-based numbering    |
| Week 3      | R1 (SOC scalability)      | Redis cache + batch inserts |
| Week 3      | R2 (Payment security)     | Tokenization integration    |
| Week 4      | R3 (Geospatial perf)      | Performance benchmarks      |
| Week 4      | R5 (Notification bloat)   | TTL policy implementation   |
| Post-launch | R8 (Enum extensions)      | Document procedures         |
| Post-launch | R9 (JSONB performance)    | Monitor + optimize          |

---

## 7. SUCCESS CRITERIA (Đánh giá Thành công)

### ✅ Database Design Success:

- [ ] All mock data flows có tương đương trong database
- [ ] No data loss khi migrate từ mock → real DB
- [ ] Query performance < 100ms for 95th percentile
- [ ] Zero critical security vulnerabilities
- [ ] 100% test coverage cho critical flows

### ✅ Migration Success:

- [ ] Zero downtime deployment (blue-green)
- [ ] < 5 minutes rollback time
- [ ] All API endpoints functional
- [ ] Real-time features working (SOC, notifications)
- [ ] Data integrity validated (FK, constraints)

### ✅ Production Readiness:

- [ ] Backup/restore tested
- [ ] Monitoring dashboards live
- [ ] Alerting configured
- [ ] Documentation complete
- [ ] Team trained

---

## 8. NEXT ACTIONS (Immediate)

### 🔥 This Week:

1. [ ] **Schedule Q&A session** với Product Owner (Q1-Q5)
2. [ ] **Tech architecture review** với leads (Q6-Q10)
3. [ ] **Security review** với Security team (Q11-Q14)
4. [ ] **DevOps planning** (Q15-Q18)

### 📋 Before Phase 1:

1. [ ] Finalize all open questions
2. [ ] Update schema based on answers
3. [ ] Revise seed data if needed
4. [ ] Update migration guide

---

## 9. CONTACT & ESCALATION

### For Questions:

- **Business Logic:** Product Owner - [Email/Slack]
- **Technical:** Backend Lead - [Email/Slack]
- **Security:** Security Team - [Email/Slack]
- **Operations:** DevOps Lead - [Email/Slack]

### Escalation Path:

1. Direct to relevant team lead
2. If blocked > 24h → Engineering Manager
3. If critical → CTO

---

**Document Owner:** Database Architect  
**Last Updated:** 2024-12-26  
**Review Cycle:** Weekly during migration, monthly post-launch  
**Status:** 🟡 Awaiting Q&A sessions
