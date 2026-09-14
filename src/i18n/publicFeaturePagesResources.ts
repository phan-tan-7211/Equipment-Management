import { getFeatureSeoByPath } from '@/lib/featureSeoContent';
import { extractFeaturePageCopy } from '@/pages/features/data/featurePageTranslations';
import * as googleWorkspace from '@/pages/features/data/googleWorkspaceData';
import * as customerCrm from '@/pages/features/data/customerCrmData';
import * as mobileFirstDesign from '@/pages/features/data/mobileFirstDesignData';

const englishCopy = (
  page: typeof googleWorkspace | typeof customerCrm | typeof mobileFirstDesign,
  path: string,
) => extractFeaturePageCopy(
  page.content, page.benefits, page.steps, page.showcases, getFeatureSeoByPath(path)!,
);

export const publicFeaturePagesResources = {
  en: {
    publicFeatures: {
      common: {
        home: 'Home', features: 'Features', faqHeading: 'Frequently asked questions', breadcrumbAria: 'Breadcrumb',
      },
      googleWorkspace: englishCopy(googleWorkspace, '/features/google-workspace'),
      customerCrm: englishCopy(customerCrm, '/features/customer-crm'),
      mobileFirstDesign: englishCopy(mobileFirstDesign, '/features/mobile-first-design'),
    },
  },
  vi: {
    publicFeatures: {
      common: {
        home: 'Trang chủ', features: 'Tính năng', faqHeading: 'Câu hỏi thường gặp', breadcrumbAria: 'Đường dẫn điều hướng',
      },
      googleWorkspace: {
        content: [
          'Nhóm của bạn đăng nhập bằng Google',
          'Nhập danh bạ, phân quyền và không cần ghi nhớ thêm mật khẩu.',
          'Cách hoạt động',
          'Kết nối Workspace, đồng bộ danh bạ rồi nhập những người cần quyền truy cập.',
          'Google Workspace',
          'Kết nối tên miền, đồng bộ danh bạ và chọn người tham gia tổ chức.',
          'Kết nối Google Workspace',
          'Tạo tài khoản miễn phí, kết nối Workspace và nhập những thành viên đầu tiên.',
          'Kết nối Google Workspace',
        ],
        benefits: [
          [
            'Đồng bộ danh bạ Google', 'Nhập những người cần quyền truy cập',
            'Kết nối tên miền Workspace và đồng bộ người dùng từ danh bạ Google. Lấy danh sách người trong tổ chức để thêm họ làm thành viên EquipQR™ chỉ với vài thao tác.',
            'Đồng bộ từ danh bạ Google', 'Đồng bộ lại khi nhân sự thay đổi', 'Quyền truy cập theo tên miền',
          ],
          [
            'Nhập thành viên', 'Chọn người tham gia tổ chức',
            'Sau khi đồng bộ, chọn người dùng trong danh bạ để thêm vào tổ chức. Có thể chọn từng người hoặc thêm hàng loạt. Người dùng ở trạng thái chờ cho đến khi đăng nhập bằng Google.',
            'Chọn người dùng từ danh bạ', 'Chờ cho đến khi đăng nhập', 'Phân quyền khi thêm',
          ],
          [
            'Đăng nhập bằng Google', 'Cách đăng nhập quen thuộc và an toàn',
            'Thành viên đăng nhập bằng tài khoản Google. Quyền quản trị được cấp sau khi xác thực danh tính Workspace. Không cần quản lý mật khẩu EquipQR™ riêng.',
            'Đăng nhập bằng Google', 'Danh tính Workspace', 'Không cần mật khẩu khác',
          ],
        ],
        steps: [
          ['Kết nối Google Workspace', 'Trong Cài đặt tổ chức → Tích hợp, kết nối Google Workspace. Cho phép EquipQR™ truy cập danh bạ của tổ chức để liên kết tên miền với tổ chức EquipQR™.'],
          ['Đồng bộ danh bạ', 'Đồng bộ người dùng từ danh bạ Google. Danh sách sẽ hiển thị những người trong Workspace. Đồng bộ lại bất kỳ lúc nào khi có nhân sự mới hoặc rời đi.'],
          ['Nhập thành viên', 'Mở “Nhập từ Google Workspace” và chọn người cần thêm. Gán vai trò quản trị viên, thành viên hoặc người xem. Người được chọn sẽ chờ đến khi đăng nhập bằng Google.'],
          ['Đăng nhập và truy cập', 'Người được mời đăng nhập bằng tài khoản Google. Sau khi xác thực, họ được thêm vào tổ chức và truy cập EquipQR™ theo vai trò, không cần gửi thư mời thủ công.'],
        ],
        showcases: [
          ['Cài đặt tổ chức hiển thị tích hợp Google Workspace cùng tên miền đã kết nối', 'Kết nối và đồng bộ danh bạ', 'Kết nối Google Workspace trong Cài đặt tổ chức. Sau khi cấp quyền, đồng bộ danh bạ để tải người dùng. Xem tên miền đã kết nối và dùng “Đồng bộ danh bạ” để làm mới danh sách.'],
          ['Danh sách thành viên nhóm hiển thị thành viên nhập từ Google Workspace cùng vai trò', 'Nhập từ Google Workspace', 'Chọn người dùng trong danh bạ đã đồng bộ để thêm làm thành viên tổ chức. Chọn vai trò rồi xác nhận. Thành viên đã nhập xuất hiện trong danh sách và có thể đăng nhập ngay bằng Google.'],
        ],
        seo: [
          'Đăng nhập SSO và đồng bộ danh bạ Google Workspace cho EquipQR',
          'Cho kỹ thuật viên đăng nhập bằng Google Workspace, đồng bộ người dùng và tiếp nhận nhân sự mà không cần thêm mật khẩu riêng.',
          'Google Workspace',
          'Đăng nhập SSO và đồng bộ danh bạ Google Workspace cho EquipQR',
          'Nhập người dùng từ danh bạ và đăng nhập bằng tài khoản Google hiện có.',
          'EquipQR có thay thế xác thực nhiều lớp của Google không?',
          'Không. Chính sách xác thực Google vẫn áp dụng. EquipQR tuân theo yêu cầu MFA của Workspace.',
          'Quản trị viên có thể giới hạn vai trò của người được nhập không?',
          'Khi nhập, quản trị viên gán vai trò trong tổ chức EquipQR cho người dùng Workspace trước khi lời mời có hiệu lực.',
          'Đồng bộ danh bạ có nhận nhân sự mới không?',
          'Đồng bộ lại sẽ làm mới danh sách thành viên để cập nhật thay đổi nhân sự mà không cần thao tác với tệp CSV.',
          'Cách tiếp nhận thành viên qua Google Workspace',
          'Tích hợp Google Workspace kết nối danh bạ của bạn với EquipQR™ qua vài bước.',
        ],
      },
      customerCrm: {
        content: [
          'Mỗi máy đều có chủ sở hữu',
          'Biết máy thuộc về ai. Lưu lịch sử bảo dưỡng theo khách hàng để hóa đơn và báo cáo gắn đúng tài khoản.',
          'Cách hoạt động', 'Thêm khách hàng, liên kết máy và lọc công việc theo chủ sở hữu.',
          'Khách hàng và máy móc', 'Hồ sơ khách hàng đi cùng thiết bị mà bạn bảo dưỡng cho họ.',
          'Liên kết khách hàng đầu tiên', 'Tạo tài khoản miễn phí, thêm khách hàng và liên kết những máy đầu tiên.',
          'Liên kết khách hàng đầu tiên',
        ],
        benefits: [
          ['Ai sở hữu máy?', 'Hồ sơ khách hàng trên thiết bị', 'Tạo hồ sơ khách hàng và liên kết thiết bị với từng khách hàng. Xem toàn bộ tài sản và thông tin liên hệ ở một nơi. Phù hợp với đơn vị cho thuê, đại lý và nhà cung cấp dịch vụ quản lý thiết bị khách hàng.', 'Thiết bị liên kết khách hàng', 'Liên hệ và chi tiết', 'Một góc nhìn cho từng khách hàng'],
          ['Lịch sử theo chủ sở hữu', 'Lệnh công việc và bảo dưỡng định kỳ của khách hàng', 'Mọi lệnh công việc và lần hoàn thành bảo dưỡng định kỳ đều được lưu trên thiết bị. Khi thiết bị gắn với khách hàng, bạn có toàn bộ lịch sử dịch vụ cho tài sản của họ để bảo hành, kiểm toán và báo cáo.', 'Lịch sử lệnh công việc', 'Hồ sơ bảo dưỡng định kỳ'],
          ['Quyền sở hữu thiết bị', 'Nhìn rõ chủ sở hữu', 'Xem nhanh thiết bị thuộc về khách hàng nào. Lọc lệnh công việc và báo cáo theo khách hàng để phục vụ thanh toán, tổng kết bảo dưỡng và bảng điều khiển riêng cho từng khách hàng.', 'Ghi nhận chủ sở hữu', 'Lọc theo khách hàng', 'Báo cáo cho khách hàng'],
        ],
        steps: [
          ['Tạo khách hàng', 'Thêm hồ sơ khách hàng với tên, thông tin liên hệ và các trường tùy chỉnh. Sắp xếp khách hàng theo loại hoặc nhóm khi cần.'],
          ['Liên kết thiết bị', 'Gán thiết bị cho khách hàng. Mỗi tài sản gắn với một chủ sở hữu để bạn lọc và báo cáo theo khách hàng; toàn bộ lịch sử dịch vụ được giữ nguyên.'],
          ['Theo dõi dịch vụ', 'Tiếp tục hoàn thành lệnh công việc và bảo dưỡng định kỳ như thường lệ. Mọi hoạt động được ghi trên thiết bị và có thể xem trong hồ sơ khách hàng sở hữu.'],
          ['Báo cáo theo khách hàng', 'Lọc lệnh công việc, thiết bị và báo cáo theo khách hàng. Dùng lịch sử dịch vụ cho yêu cầu bảo hành, kiểm toán và tổng kết bảo dưỡng riêng.'],
        ],
        showcases: [
          ['Danh sách thiết bị đang theo dõi; mỗi thiết bị có thể liên kết với một khách hàng', 'Khách hàng và thiết bị liên kết', 'Xem khách hàng cùng các thiết bị của họ. Mở hồ sơ để xem liên hệ và mọi tài sản bạn bảo dưỡng. Tạo hoặc sửa khách hàng rồi gán thiết bị.'],
          ['Trang chi tiết nhóm dịch vụ hiển thị thành viên và thiết bị họ phụ trách', 'Nhóm dịch vụ và thiết bị khách hàng', 'Gán nhóm dịch vụ cho thiết bị khách hàng để đúng kỹ thuật viên nhận lệnh công việc. Thành viên chỉ xem những tài sản họ phụ trách, giúp sắp xếp dữ liệu và kiểm soát truy cập.'],
        ],
        seo: [
          'CRM khách hàng gắn với lịch sử bảo dưỡng thiết bị',
          'Liên kết chủ sở hữu, vị trí và thông tin liên hệ với từng tài sản để hóa đơn và lịch sử dịch vụ gắn đúng khách hàng.',
          'CRM khách hàng', 'CRM khách hàng gắn với lịch sử bảo dưỡng thiết bị',
          'Liên kết thiết bị với khách hàng. Lưu lịch sử dịch vụ lâu dài theo từng tài sản.',
          'Một khách hàng có thể sở hữu nhiều tài sản không?', 'Có. Bạn có thể gắn nhiều hồ sơ thiết bị và vẫn giữ lịch sử bảo dưỡng định kỳ và lệnh công việc.',
          'CRM có liên kết với khách hàng QuickBooks không?', 'Ánh xạ nhóm với khách hàng giúp hóa đơn xuất sang đúng hồ sơ QuickBooks.',
          'Ai có thể chỉnh sửa hồ sơ khách hàng?', 'Quản trị viên tổ chức kiểm soát quyền tạo, đọc, sửa, xóa; kỹ thuật viên có thể xem thông tin cần thiết khi làm việc.',
          'Cách hoạt động của CRM khách hàng', 'CRM khách hàng kết nối khách hàng, thiết bị và lịch sử dịch vụ ở một nơi.',
        ],
      },
      mobileFirstDesign: {
        content: [
          'Xưởng vận hành ngay trên điện thoại',
          'Kỹ thuật viên có giao diện nhanh, dễ thao tác trên điện thoại và máy tính bảng, kể cả khi mất sóng.',
          'Cách hoạt động', 'Đăng nhập trên điện thoại, xử lý công việc rồi tiếp tục trên màn hình khác.',
          'Lệnh công việc trên di động', 'Lệnh công việc, chi tiết và danh sách kiểm tra bảo dưỡng phù hợp màn hình điện thoại.',
          'Mở EquipQR trên điện thoại', 'Tạo tài khoản miễn phí và xử lý công việc tiếp theo ngay trên điện thoại.',
          'Mở EquipQR trên điện thoại',
        ],
        benefits: [
          ['Làm việc khi mất sóng', 'Cập nhật sẽ đồng bộ khi có mạng trở lại', 'Xem thiết bị, lệnh công việc và danh sách kiểm tra bảo dưỡng khi ngoại tuyến. Ghi nhận cập nhật và hoàn tất kiểm tra. Dữ liệu tự đồng bộ khi có mạng.', 'Truy cập dữ liệu quan trọng ngoại tuyến', 'Đồng bộ khi kết nối', 'Không mất công việc'],
          ['Dễ thao tác khi đeo găng', 'Nút và danh sách phù hợp điện thoại', 'Nút, danh sách và biểu mẫu được thiết kế cho thao tác chạm. Chuyển nhanh giữa thiết bị, lệnh công việc và bảo dưỡng định kỳ. Quét QR, điền biểu mẫu và hoàn tất kiểm tra thuận tiện trên điện thoại.', 'Điều khiển dễ chạm', 'Biểu mẫu phù hợp di động', 'Điều hướng nhanh'],
          ['Điện thoại ở hiện trường, máy tính ở văn phòng', 'Một tài khoản trên mọi màn hình', 'Dùng EquipQR trên iOS, Android hoặc máy tính. Cùng tài khoản và dữ liệu ở mọi nơi. Kỹ thuật viên làm việc trên điện thoại ngoài hiện trường, quản trị viên thao tác trên màn hình lớn.', 'Dùng trên mọi thiết bị', 'Giao diện thích ứng', 'Một ứng dụng cho mọi màn hình'],
        ],
        steps: [
          ['Truy cập mọi nơi', 'Đăng nhập từ điện thoại, máy tính bảng hoặc máy tính. Dữ liệu và tính năng tương tự trên mọi thiết bị; bố cục phù hợp với từng màn hình.'],
          ['Làm việc ngoại tuyến khi cần', 'Ở nơi sóng yếu, tiếp tục xem thiết bị và lệnh công việc, hoàn thành kiểm tra bảo dưỡng. Thay đổi tự đồng bộ khi có mạng để không mất dữ liệu.'],
          ['Thao tác tối ưu cho cảm ứng', 'Quét mã QR, điền biểu mẫu, hoàn thành danh sách kiểm tra và thêm phụ tùng bằng điện thoại. Nút dễ chạm và điều hướng đơn giản giúp thao tác nhanh, ít lỗi.'],
          ['Tiếp tục trên thiết bị khác', 'Bắt đầu trên điện thoại ngoài hiện trường rồi tiếp tục trên máy tính bảng hoặc máy tính. Tài khoản, tổ chức và dữ liệu luôn đồng bộ.'],
        ],
        showcases: [
          ['', 'Lệnh công việc và kiểm tra bảo dưỡng trên di động', 'Xem và hoàn thành lệnh công việc trên điện thoại. Danh sách kiểm tra bảo dưỡng dễ thao tác nhờ nút lớn. Xem trạng thái, chi tiết thiết bị, nhóm được giao và tiến độ ở một màn hình.',
            'Danh sách lệnh công việc trên di động gồm các lệnh tạo qua quét mã và đang xử lý',
            'Chi tiết lệnh công việc trên di động gồm thiết bị, vị trí, nhóm và trạng thái kiểm tra bảo dưỡng',
            'Danh sách kiểm tra bảo dưỡng trên di động với các mục đã hoàn thành cho máy đào'],
        ],
        seo: [
          'Trải nghiệm CMMS di động cho kỹ thuật viên hiện trường',
          'Giao diện thích ứng, quy trình thân thiện ngoại tuyến và thao tác cảm ứng giúp nhóm làm việc hiệu quả trên điện thoại và máy tính bảng.',
          'Ưu tiên di động', 'Trải nghiệm CMMS di động cho kỹ thuật viên hiện trường',
          'Tối ưu cho điện thoại và máy tính bảng. Làm việc ngoại tuyến ngoài hiện trường.',
          'Những quy trình nào hỗ trợ ngoại tuyến?', 'Các quy trình thiết yếu của kỹ thuật viên vẫn dùng được khi mất kết nối và tự đồng bộ khi có sóng trở lại.',
          'Cỡ chữ và vùng chạm có tính đến WCAG không?', 'EquipQR tuân theo hướng dẫn độ tương phản cho giao diện tối và cung cấp vùng chạm lớn phù hợp khi đeo găng.',
          'Máy tính bảng có hiển thị bản đồ như máy tính không?', 'Bản đồ đội máy thích ứng với kích thước màn hình để người điều phối tại hiện trường theo dõi như trên máy tính.',
          'Cách các quy trình ưu tiên di động hoạt động', 'EquipQR™ hoạt động trong xưởng, ngoài hiện trường hoặc tại bàn làm việc.',
        ],
      },
    },
  },
  ko: {
    publicFeatures: {
      common: {
        home: '홈', features: '기능', faqHeading: '자주 묻는 질문', breadcrumbAria: '이동 경로',
      },
      googleWorkspace: {
        content: [
          'Google 계정으로 팀 로그인', '디렉터리를 가져와 역할을 지정하세요. 새 비밀번호를 기억할 필요가 없습니다.',
          '이용 방법', 'Workspace를 연결하고 디렉터리를 동기화해 접근 권한이 필요한 사람을 가져오세요.',
          'Google Workspace', '도메인을 연결하고 디렉터리를 동기화한 뒤 조직에 참여할 사용자를 선택하세요.',
          'Google Workspace 연결', '무료 계정을 만들고 Workspace를 연결해 첫 구성원을 가져오세요.', 'Google Workspace 연결',
        ],
        benefits: [
          ['Google 디렉터리 동기화', '접근 권한이 필요한 사용자 가져오기', 'Workspace 도메인을 연결하고 Google 디렉터리의 사용자를 동기화하세요. 조직 구성원을 불러와 몇 번의 클릭으로 EquipQR™ 구성원으로 추가할 수 있습니다.', 'Google 디렉터리에서 동기화', '구성원 변경 시 재동기화', '도메인별 접근 권한'],
          ['구성원 가져오기', '조직 참여자 선택', '동기화 후 조직에 추가할 디렉터리 사용자를 선택하세요. 개별 또는 일괄 추가가 가능합니다. 사용자가 Google로 로그인할 때까지 대기 상태로 표시됩니다.', '디렉터리에서 사용자 선택', '로그인 전까지 대기', '추가 시 역할 지정'],
          ['Google 로그인', '안전하고 친숙한 로그인', '구성원은 Google 계정으로 로그인합니다. Workspace 신원을 인증한 뒤 관리자 권한이 부여됩니다. 별도 EquipQR™ 비밀번호를 관리할 필요가 없습니다.', 'Google로 로그인', 'Workspace 신원', '추가 비밀번호 불필요'],
        ],
        steps: [
          ['Google Workspace 연결', '조직 설정 → 연동에서 Google Workspace를 연결하세요. EquipQR™의 조직 디렉터리 접근을 승인하면 도메인이 EquipQR™ 조직에 연결됩니다.'],
          ['디렉터리 동기화', 'Google 디렉터리의 사용자를 동기화하세요. Workspace 사용자 목록이 표시됩니다. 신규 입사자나 퇴사자를 반영하려면 언제든 재동기화할 수 있습니다.'],
          ['구성원 가져오기', '“Google Workspace에서 가져오기”를 열어 추가할 사용자를 고르고 관리자, 구성원, 조회자 역할을 지정하세요. 선택한 사용자는 Google 로그인 전까지 대기 상태입니다.'],
          ['로그인 및 접근', '초대된 사용자는 Google 계정으로 로그인합니다. 인증 후 역할에 따라 조직과 EquipQR™에 접근할 수 있습니다. 별도의 수동 초대 이메일은 필요하지 않습니다.'],
        ],
        showcases: [
          ['연결된 도메인과 Google Workspace 연동을 보여주는 조직 설정', '디렉터리 연결 및 동기화', '조직 설정에서 Google Workspace를 연결하세요. 승인 후 디렉터리를 동기화해 사용자를 불러옵니다. 연결된 도메인을 확인하고 “디렉터리 동기화”로 목록을 갱신하세요.'],
          ['EquipQR에 가져온 Google Workspace 구성원과 역할을 보여주는 팀 명단', 'Google Workspace에서 가져오기', '동기화된 디렉터리에서 조직 구성원을 선택하고 역할을 지정한 뒤 확인하세요. 가져온 구성원은 명단에 표시되며 Google 계정으로 바로 로그인할 수 있습니다.'],
        ],
        seo: [
          'EquipQR을 위한 Google Workspace SSO 및 디렉터리 동기화',
          '기술자가 Google Workspace로 로그인하고 디렉터리를 동기화해 별도 비밀번호 없이 구성원을 등록할 수 있습니다.',
          'Google Workspace', 'EquipQR을 위한 Google Workspace SSO 및 디렉터리 동기화',
          '디렉터리에서 사용자를 가져오고 기존 Google 계정으로 로그인하세요.',
          'EquipQR이 Google MFA를 대체하나요?', '아니요. Google 인증 정책이 그대로 적용되며 EquipQR은 Workspace의 MFA 요구사항을 따릅니다.',
          '관리자가 가져올 사용자의 역할을 제한할 수 있나요?', '가져오기 과정에서 관리자가 Workspace 사용자의 EquipQR 조직 역할을 지정한 후 초대가 활성화됩니다.',
          '신규 입사자도 디렉터리 동기화에 반영되나요?', '재동기화하면 구성원 목록이 갱신되므로 CSV를 수동으로 처리하지 않아도 인사 변동을 반영할 수 있습니다.',
          'Google Workspace를 통한 구성원 등록 방법', 'Google Workspace 연동으로 몇 단계 만에 디렉터리와 EquipQR™을 연결할 수 있습니다.',
        ],
      },
      customerCrm: {
        content: [
          '모든 장비에는 소유자가 있습니다', '장비 소유자를 파악하세요. 고객별 정비 이력을 보관하면 청구서와 보고서를 올바른 계정에 연결할 수 있습니다.',
          '이용 방법', '고객을 추가하고 장비를 연결한 뒤 소유자별로 작업을 필터링하세요.',
          '고객과 장비', '고객 정보와 해당 고객을 위해 관리하는 장비를 함께 보세요.',
          '첫 고객 연결', '무료 계정을 만들고 고객을 추가해 첫 장비를 연결하세요.', '첫 고객 연결',
        ],
        benefits: [
          ['장비의 소유자는 누구인가요?', '장비에 연결된 고객 기록', '고객 기록을 만들고 각 고객에게 장비를 연결하세요. 자산과 연락처를 한곳에서 확인할 수 있습니다. 고객 장비를 관리하는 임대업체, 대리점 및 서비스 제공업체에 적합합니다.', '고객 연결 장비', '연락처 및 세부 정보', '고객별 통합 보기'],
          ['소유자별 이력', '해당 고객의 작업 지시 및 예방 정비', '모든 작업 지시와 예방 정비 완료 내역이 장비에 저장됩니다. 장비를 고객에게 연결하면 보증, 감사 및 보고에 필요한 서비스 이력을 고객 자산별로 확인할 수 있습니다.', '작업 지시 이력', '예방 정비 기록'],
          ['장비 소유 관계', '소유 관계를 한눈에', '각 장비가 어느 고객에게 속하는지 빠르게 확인하세요. 고객별로 작업 지시와 보고서를 필터링하여 청구, 정비 요약 및 고객별 대시보드에 활용할 수 있습니다.', '소유 관계 표시', '고객별 필터링', '고객 보고서'],
        ],
        steps: [
          ['고객 생성', '이름, 연락처 및 사용자 지정 필드가 포함된 고객 기록을 추가하세요. 필요에 따라 유형이나 그룹별로 고객을 정리할 수 있습니다.'],
          ['장비 연결', '장비를 고객에게 할당하세요. 자산마다 소유자가 연결되므로 고객별 필터링과 보고가 가능하며, 서비스 이력은 모두 유지됩니다.'],
          ['서비스 추적', '평소처럼 작업 지시와 예방 정비를 완료하세요. 모든 활동은 장비에 기록되고 소유 고객의 맥락에서 확인할 수 있습니다.'],
          ['고객별 보고', '고객별로 작업 지시, 장비 및 보고서를 필터링하세요. 서비스 이력을 보증 청구, 감사 및 고객별 정비 요약에 활용하세요.'],
        ],
        showcases: [
          ['추적 중인 장비 목록. 각 장비를 고객과 연결할 수 있음', '고객 및 연결 장비', '모든 고객과 연결 장비를 확인하세요. 고객을 열면 연락처와 관리 중인 자산을 볼 수 있습니다. 고객을 만들거나 수정하고 장비를 할당하세요.'],
          ['팀 구성원과 담당 장비를 보여주는 서비스 팀 상세 페이지', '서비스 팀과 고객 장비', '서비스 팀을 고객 장비에 배정해 적절한 기술자가 작업 지시를 받도록 하세요. 팀원은 자신이 담당하는 자산만 볼 수 있어 고객 데이터와 접근 권한을 관리하기 쉽습니다.'],
        ],
        seo: [
          '장비 서비스 이력과 연결되는 고객 CRM', '소유자, 위치 및 연락처를 자산과 연결해 청구서와 서비스 내역이 올바른 고객에 속하도록 하세요.',
          '고객 CRM', '장비 서비스 이력과 연결되는 고객 CRM', '장비를 고객에게 연결하고 고객 자산별 서비스 이력을 보관하세요.',
          '한 고객이 여러 자산을 소유할 수 있나요?', '예. 여러 장비 기록을 연결하면서 예방 정비와 작업 지시 이력을 유지할 수 있습니다.',
          'CRM은 QuickBooks 고객과 연동되나요?', '팀과 고객의 매핑을 통해 청구서 내보내기가 올바른 QuickBooks 고객 프로필에 연결됩니다.',
          '누가 고객 기록을 수정할 수 있나요?', '조직 관리자가 생성·조회·수정·삭제 권한을 관리하고 기술자는 현장에서 필요한 정보를 읽기 전용으로 볼 수 있습니다.',
          '고객 CRM 이용 방법', '고객 CRM은 고객, 장비 및 서비스 이력을 한곳에 연결합니다.',
        ],
      },
      mobileFirstDesign: {
        content: [
          '현장 업무를 휴대폰에서 처리하세요', '기술자는 신호가 끊겨도 휴대폰과 태블릿에서 빠르고 터치하기 쉬운 화면을 사용할 수 있습니다.',
          '이용 방법', '휴대폰에서 로그인해 작업하고 나중에 다른 화면에서 이어서 처리하세요.',
          '모바일 작업 지시', '휴대폰 화면에 맞춘 작업 지시, 상세 정보 및 예방 정비 점검표.',
          '휴대폰에서 EquipQR 열기', '무료 계정을 만들고 다음 작업을 휴대폰에서 처리하세요.', '휴대폰에서 EquipQR 열기',
        ],
        benefits: [
          ['신호가 끊겨도 작업', '연결되면 업데이트가 동기화됩니다', '오프라인에서 장비, 작업 지시 및 예방 정비 점검표를 확인하세요. 업데이트를 기록하고 점검을 완료하면 온라인 복귀 시 데이터가 자동 동기화됩니다.', '주요 데이터 오프라인 접근', '연결 시 동기화', '작업 손실 없음'],
          ['장갑 낀 손에도 편리하게', '휴대폰에 맞는 버튼과 목록', '버튼, 목록 및 양식을 터치 조작에 맞게 설계했습니다. 장비, 작업 지시 및 점검표 사이를 빠르게 이동하고 QR 스캔과 양식 입력, 점검 완료를 휴대폰에서 편하게 처리하세요.', '터치하기 쉬운 조작', '모바일 친화적인 양식', '빠른 이동'],
          ['현장에서는 휴대폰, 사무실에서는 컴퓨터', '모든 화면에서 같은 계정', 'iOS, Android 또는 컴퓨터에서 EquipQR을 사용하세요. 어디서나 같은 계정과 데이터가 제공됩니다. 기술자는 현장에서 휴대폰으로, 관리자는 큰 화면으로 작업합니다.', '모든 기기에서 사용', '반응형 화면', '모든 화면을 위한 하나의 앱'],
        ],
        steps: [
          ['어디서나 접속', '휴대폰, 태블릿 또는 컴퓨터에서 로그인하세요. 동일한 데이터와 기능을 사용할 수 있고 화면 크기에 맞게 레이아웃이 조정됩니다.'],
          ['필요할 때 오프라인 작업', '신호가 약한 곳에서도 장비와 작업 지시를 확인하고 예방 정비 점검표를 완료하세요. 연결이 복구되면 변경 사항이 자동 동기화됩니다.'],
          ['터치에 최적화된 흐름', '휴대폰으로 QR 코드를 스캔하고 양식을 작성하고 점검표를 완료하며 부품을 추가하세요. 큰 터치 영역과 간단한 탐색으로 빠르게 작업할 수 있습니다.'],
          ['다른 기기에서 이어서 작업', '현장에서 휴대폰으로 시작한 작업을 나중에 태블릿이나 컴퓨터에서 이어서 하세요. 계정, 조직 및 데이터가 모든 기기에 동기화됩니다.'],
        ],
        showcases: [
          ['', '모바일 작업 지시 및 예방 정비 점검표', '휴대폰에서 작업 지시를 확인하고 완료하세요. 큰 터치 영역으로 점검표를 쉽게 작성하고 작업 상태, 장비 상세, 담당 팀과 진행 상황을 한 화면에서 볼 수 있습니다.',
            'QR 스캔으로 생성된 작업과 진행 중인 작업을 보여주는 모바일 작업 지시 목록',
            '장비, 위치, 팀 및 예방 정비 점검 상태를 보여주는 모바일 작업 상세',
            '굴착기 예방 정비의 완료된 항목을 보여주는 모바일 점검표'],
        ],
        seo: [
          '현장 기술자를 위한 모바일 CMMS 환경', '반응형 화면과 오프라인 친화적인 흐름, 터치 조작으로 휴대폰과 태블릿에서 효율적으로 작업할 수 있습니다.',
          '모바일 우선', '현장 기술자를 위한 모바일 CMMS 환경', '휴대폰과 태블릿에 최적화되어 현장에서 오프라인으로도 작업할 수 있습니다.',
          '어떤 작업 흐름이 오프라인을 지원하나요?', '핵심 기술자 작업은 연결이 끊겨도 사용할 수 있고 신호가 돌아오면 자동으로 동기화됩니다.',
          '글꼴과 터치 영역이 WCAG를 고려하나요?', 'EquipQR은 다크 테마 대비 지침을 따르고 장갑을 낀 손에도 편리하도록 넉넉한 터치 영역을 제공합니다.',
          '태블릿에서도 데스크톱과 같은 지도를 사용할 수 있나요?', '장비 지도는 화면에 맞게 조정되어 현장 담당자도 배차 화면과 동일하게 확인할 수 있습니다.',
          '모바일 우선 작업 흐름 이용 방법', 'EquipQR™은 작업장, 현장 또는 사무실에서 사용할 수 있습니다.',
        ],
      },
    },
  },
} as const;
