import { getFeatureSeoByPath } from '@/lib/featureSeoContent';
import { extractFeaturePageCopy } from '@/pages/features/data/featurePageTranslations';
import * as fleet from '@/pages/features/data/fleetVisualizationData';
import * as quickBooks from '@/pages/features/data/quickBooksData';

export const publicFeatureFleetBooksResources = {
  en: {
    publicFeatures: {
      fleetVisualization: extractFeaturePageCopy(
        fleet.content, fleet.benefits, fleet.steps, fleet.showcases,
        getFeatureSeoByPath('/features/fleet-visualization')!,
      ),
      quickBooks: extractFeaturePageCopy(
        quickBooks.content, quickBooks.benefits, quickBooks.steps, quickBooks.showcases,
        getFeatureSeoByPath('/features/quickbooks')!,
      ),
    },
  },
  vi: {
    publicFeatures: {
      fleetVisualization: {
        content: [
          'Vị trí xác nhận gần nhất trên bản đồ',
          'Xem từng máy được xác nhận ở đâu gần đây, máy nào đến hạn bảo dưỡng và nơi tập trung lệnh công việc. Không cần thiết bị GPS.',
          'Cách hoạt động', 'Đặt vị trí cho máy, mở bản đồ và lên kế hoạch tuyến tiếp theo.',
          'Bản đồ đội máy', 'Mọi thiết bị có vị trí đã lưu đều xuất hiện dưới dạng điểm trên bản đồ. Dùng địa chỉ hoặc tên công trường sẵn có.',
          'Mở bản đồ đội máy', 'Tạo tài khoản miễn phí, thêm vị trí cho thiết bị rồi mở bản đồ.',
          'Mở bản đồ đội máy',
        ],
        benefits: [
          ['Vị trí xác nhận gần nhất', 'Biết lần cuối tài sản xuất hiện ở đâu', 'Hiển thị thiết bị trên bản đồ tương tác bằng vị trí xác nhận gần nhất lưu trong hồ sơ. Nhập địa chỉ, tên công trường hoặc tọa độ. Lọc theo nhóm, trạng thái hoặc loại thiết bị.', 'Không cần thiết bị GPS', 'Lọc theo nhóm hoặc trạng thái', 'Chọn điểm để xem đầy đủ chi tiết'],
          ['Lên kế hoạch tuyến tiếp theo', 'Máy đến hạn bảo dưỡng và việc đang mở trên bản đồ', 'Xem các nhóm thiết bị đến hạn bảo dưỡng hoặc có lệnh công việc đang mở. Nhóm theo vị trí để điều phối kỹ thuật viên và giảm di chuyển giữa các địa điểm.', 'Nhóm việc bảo dưỡng và lệnh công việc', 'Điều phối theo khu vực', 'Bối cảnh địa lý để lên lịch'],
          ['Nơi tập trung công việc', 'Xem điểm nóng không cần bảng tính', 'Kết hợp bản đồ với chỉ số hiệu suất và mức sử dụng đội máy. Xác định nơi sử dụng nhiều, điểm nóng bảo dưỡng và vùng ít sử dụng để phân bổ máy phù hợp.', 'Mức sử dụng theo vị trí', 'Điểm nóng bảo dưỡng', 'Lớp dữ liệu hiệu suất đội máy'],
        ],
        steps: [
          ['Đặt vị trí thiết bị', 'Đặt vị trí xác nhận gần nhất cho từng thiết bị bằng địa chỉ, công trường hoặc tọa độ. Cập nhật khi máy di chuyển để bản đồ thể hiện nơi xuất hiện gần nhất.'],
          ['Xem bản đồ đội máy', 'Mở bản đồ tương tác để xem mọi thiết bị có vị trí. Di chuyển, phóng to và lọc theo nhóm, trạng thái hoặc loại. Chọn điểm để mở chi tiết thiết bị.'],
          ['Lên tuyến và điều phối', 'Xác định trên bản đồ những máy đến hạn bảo dưỡng hoặc có việc đang mở. Nhóm theo vị trí để lên tuyến cho kỹ thuật viên và giảm thời gian đi lại.'],
          ['Phân tích theo khu vực', 'Kết hợp bản đồ với mức sử dụng và hiệu suất đội máy. Tìm quy luật theo vùng, điều chuyển tài sản và bố trí năng lực bảo dưỡng theo nhu cầu.'],
        ],
        showcases: [
          ['Bản đồ đội máy hiển thị các điểm thiết bị trên khắp Hoa Kỳ cùng bảng vị trí và bộ lọc', 'Thiết bị tại vị trí xác nhận gần nhất', 'Bản đồ hiển thị mọi thiết bị có vị trí đã lưu như địa chỉ, tên công trường hoặc tọa độ. Bảng bên liệt kê từng máy với nhóm, vị trí và liên kết truy cập nhanh. Lọc theo nhóm hoặc trạng thái để tập trung theo dõi.'],
        ],
        seo: [
          'Bản đồ đội máy và vị trí gần nhất của thiết bị hạng nặng', 'Hiển thị thiết bị qua địa chỉ hoặc tọa độ gần nhất, lọc theo nhóm và kết hợp bản đồ với chỉ số sử dụng đội máy.',
          'Bản đồ đội máy', 'Bản đồ đội máy và vị trí gần nhất của thiết bị hạng nặng', 'Xem vị trí xác nhận gần nhất của từng máy trên bản đồ tương tác.',
          'EquipQR có cần thiết bị GPS không?', 'Không cần phần cứng GPS riêng. Xưởng có thể dùng địa chỉ hoặc tọa độ được ghi nhận khi điều phối.',
          'Bản đồ có lọc được máy quá hạn bảo dưỡng không?', 'Nhóm có thể kết hợp lớp dữ liệu đội máy với bộ lọc lệnh công việc để ưu tiên máy gần đó cần bảo dưỡng.',
          'Bao lâu nên cập nhật vị trí một lần?', 'Nên cập nhật mỗi khi thiết bị chuyển công trường để thông tin tuyến đường đáng tin cậy.',
          'Cách hiển thị đội máy trên bản đồ', 'Bản đồ đội máy tập hợp vị trí và trạng thái thiết bị trong cùng một màn hình.',
        ],
      },
      quickBooks: {
        content: [
          'Công việc hoàn tất trở thành hóa đơn nháp', 'Xuất lệnh công việc hoàn tất sang QuickBooks Online. Ánh xạ nhóm với khách hàng một lần và không phải nhập lại giờ tính phí trong phần mềm kế toán.',
          'Cách hoạt động', 'Kết nối QuickBooks, ánh xạ nhóm với khách hàng rồi xuất công việc hoàn tất thành bản nháp.',
          'Xuất sang QuickBooks', 'Lệnh công việc hoàn tất trở thành hóa đơn nháp, kèm công lao động, phụ tùng và khách hàng đã ánh xạ.',
          'Xuất hóa đơn nháp', 'Kết nối QuickBooks, ánh xạ nhóm với khách hàng và xuất công việc hoàn tất thành bản nháp.',
          'Xuất hóa đơn nháp',
        ],
        benefits: [
          ['Xuất thành hóa đơn', 'Từ lệnh công việc đến hóa đơn nháp', 'Xuất lệnh công việc đã hoàn tất sang QuickBooks Online dưới dạng hóa đơn nháp. Chi tiết công việc, công lao động và phụ tùng được đưa vào hóa đơn. Kiểm tra và gửi từ QuickBooks khi sẵn sàng.', 'Xuất bằng một lần chọn', 'Hóa đơn nháp trong QuickBooks', 'Lịch sử và trạng thái xuất'],
          ['Ánh xạ nhóm với khách hàng', 'Liên kết nhóm với khách hàng QuickBooks', 'Thiết bị thuộc nhóm; nhóm được ánh xạ với khách hàng QuickBooks. Khi xuất lệnh công việc, hóa đơn được tạo cho khách hàng liên kết với nhóm của thiết bị. Thiết lập ánh xạ một lần trong cài đặt nhóm.', 'Nhóm với khách hàng QuickBooks', 'Tìm và chọn khách hàng', 'Giữ ánh xạ khi ngắt kết nối'],
          ['Kết nối trong Cài đặt tổ chức', 'Đăng nhập Intuit rồi ánh xạ khách hàng', 'Kết nối QuickBooks qua OAuth trong Cài đặt tổ chức. Đăng nhập tài khoản Intuit, cấp quyền cho EquipQR™ và hoàn tất. Token tự làm mới; chỉ kết nối lại khi cần.', 'Kết nối trong Cài đặt tổ chức', 'Tự làm mới token', 'Môi trường thử nghiệm và sản xuất'],
        ],
        steps: [
          ['Kết nối QuickBooks', 'Trong Cài đặt tổ chức → Tích hợp, kết nối QuickBooks Online và cấp quyền qua Intuit OAuth. Tổ chức của bạn được liên kết với công ty QuickBooks; trạng thái kết nối hiển thị trong cài đặt.'],
          ['Ánh xạ nhóm với khách hàng', 'Ánh xạ từng nhóm với một khách hàng QuickBooks. Lệnh công việc của thiết bị thuộc nhóm sẽ xuất thành hóa đơn nháp cho khách hàng đó. Dùng ô tìm kiếm để chọn đúng khách hàng.'],
          ['Hoàn tất lệnh công việc', 'Hoàn thành lệnh công việc như thường lệ. Chỉ lệnh ở trạng thái “Đã hoàn tất” mới xuất được. Hãy kiểm tra thiết bị đã có nhóm và nhóm đã ánh xạ khách hàng QuickBooks.'],
          ['Xuất sang QuickBooks', 'Tại chi tiết lệnh công việc, chọn “Xuất sang QuickBooks” để tạo hóa đơn nháp. Xem lịch sử xuất, mở hóa đơn trong QuickBooks và quản lý thanh toán tại đó. Không thể xuất lại sau khi đã có hóa đơn.'],
        ],
        showcases: [
          ['Video di động mô tả xuất lệnh công việc EquipQR đã hoàn tất sang hóa đơn nháp QuickBooks Online', 'Xuất lệnh công việc sang QuickBooks trên điện thoại', 'Xem cách xuất lệnh công việc hoàn tất từ EquipQR sang hóa đơn nháp QuickBooks Online chỉ trong vài thao tác. Công lao động, phụ tùng và ánh xạ khách hàng được chuyển sang để bạn kiểm tra và gửi hóa đơn trong QuickBooks.'],
          ['Cài đặt tổ chức hiển thị QuickBooks Online và Google Workspace đã kết nối cùng công tắc vị trí quét QR', 'QuickBooks đã kết nối trong Cài đặt tổ chức', 'Kết nối QuickBooks Online từ Cài đặt tổ chức → Tích hợp. Huy hiệu trạng thái xác nhận liên kết OAuth đang hoạt động và token tự làm mới. Không cần xác thực lại trừ khi bạn chủ động ngắt kết nối.'],
          ['Chi tiết lệnh công việc hoàn tất hiển thị thiết bị, trạng thái kiểm tra bảo dưỡng và người được giao', 'Xuất lệnh công việc hoàn tất chỉ với một thao tác', 'Khi lệnh công việc được đánh dấu hoàn tất, dùng thao tác Xuất sang QuickBooks tại trang chi tiết. Hóa đơn nháp được tạo trong công ty QuickBooks và gắn với khách hàng ánh xạ từ nhóm của thiết bị.'],
        ],
        seo: [
          'Xuất lệnh công việc thành hóa đơn QuickBooks cho xưởng sửa chữa', 'Đưa công việc hoàn tất sang QuickBooks Online dưới dạng hóa đơn nháp với dòng công lao động và phụ tùng tổng hợp. Giảm thao tác bảng tính giữa xưởng và kế toán.',
          'QuickBooks', 'Xuất lệnh công việc thành hóa đơn QuickBooks cho xưởng sửa chữa', 'Liên kết QuickBooks Online, ánh xạ nhóm với khách hàng rồi xuất lệnh công việc hoàn tất thành hóa đơn nháp qua quy trình có hướng dẫn.',
          'EquipQR tích hợp với sản phẩm QuickBooks nào?', 'EquipQR tích hợp QuickBooks Online qua Intuit OAuth. Trạng thái kết nối trong Cài đặt tổ chức giúp quản trị viên theo dõi token.',
          'Hóa đơn xuất cho khách hàng gồm những gì?', 'Bản xuất tổng hợp công lao động và phụ tùng theo quy tắc tính phí của EquipQR. Nhân viên hoàn thiện nội dung trong QuickBooks trước khi gửi.',
          'Có thể kết nối lại khi token QuickBooks hết hạn không?', 'Mở Cài đặt tổ chức rồi Tích hợp để kết nối lại. Các ánh xạ nhóm với khách hàng lưu trong EquipQR vẫn được giữ.',
          'Cách tích hợp QuickBooks hoạt động', 'Tích hợp QuickBooks liên kết lệnh công việc, nhóm và khách hàng với quy trình kế toán.',
        ],
      },
    },
  },
  ko: {
    publicFeatures: {
      fleetVisualization: {
        content: [
          '지도에서 마지막 확인 위치 확인', '각 장비의 최근 확인 위치, 예방 정비 기한 및 진행 중인 작업이 모인 지역을 확인하세요. GPS 장비는 필요하지 않습니다.',
          '이용 방법', '장비 위치를 설정하고 지도를 열어 다음 이동 경로를 계획하세요.',
          '장비 지도', '저장된 위치가 있는 모든 장비가 지도 마커로 나타납니다. 기록에 있는 주소나 현장 이름을 활용하세요.',
          '장비 지도 열기', '무료 계정을 만들고 장비 위치를 추가한 뒤 지도를 열어보세요.', '장비 지도 열기',
        ],
        benefits: [
          ['마지막 확인 위치', '자산이 마지막으로 확인된 곳', '각 기록에 저장된 마지막 확인 위치로 장비를 대화형 지도에 표시하세요. 주소, 현장 이름 또는 좌표를 입력하고 팀, 상태 또는 장비 유형별로 필터링할 수 있습니다.', 'GPS 장비 불필요', '팀 또는 상태별 필터', '마커를 눌러 상세 보기'],
          ['다음 이동 경로 계획', '지도에서 정비 기한과 진행 중인 작업 확인', '지도를 통해 예방 정비 기한이 다가오거나 진행 중인 작업이 있는 장비의 밀집 지역을 확인하세요. 위치별로 묶어 기술자를 배치하고 현장 간 이동을 줄일 수 있습니다.', '예방 정비 및 작업 밀집도', '지역별 배치', '일정 계획을 위한 위치 정보'],
          ['작업 밀집 지역 파악', '스프레드시트 없이 집중 지역 확인', '지도와 장비 효율 및 사용률 지표를 결합하세요. 사용량이 많은 지역, 정비 집중 지역 및 저활용 지역을 찾아 수요에 맞게 장비를 배치하세요.', '위치별 사용률', '정비 집중 지역', '장비 효율 지표'],
        ],
        steps: [
          ['장비 위치 설정', '각 장비의 마지막 확인 위치를 주소, 작업 현장 또는 좌표로 설정하세요. 장비가 이동하면 업데이트하여 지도에 최근 확인 위치가 반영되도록 하세요.'],
          ['장비 지도 보기', '지도에서 위치가 저장된 모든 장비를 확인하세요. 이동 및 확대하고 팀, 상태 또는 유형별로 필터링하세요. 마커를 누르면 장비 상세 화면이 열립니다.'],
          ['경로 계획 및 배치', '지도에서 예방 정비 기한이 다가오거나 진행 중인 작업이 있는 장비를 찾으세요. 위치별로 묶어 기술자 이동 경로를 계획하고 이동 시간을 줄이세요.'],
          ['지역별 분석', '지도에 장비 효율과 사용률을 결합하세요. 지역별 추세를 찾아 자산을 이동하고 수요가 높은 곳에 정비 인력을 배치하세요.'],
        ],
        showcases: [
          ['위치 정보와 필터가 있는 미국 전역의 장비 마커 지도', '마지막 확인 위치의 장비', '지도에는 저장된 주소, 현장 이름 또는 좌표가 있는 장비가 표시됩니다. 옆 패널에는 각 장비의 팀, 위치 및 빠른 이동 링크가 나옵니다. 팀이나 상태로 필터링하세요.'],
        ],
        seo: [
          '중장비의 마지막 확인 위치와 장비 지도', '최근 확인 주소나 좌표로 장비를 표시하고 팀별로 필터링하며 지도와 장비 사용률 지표를 함께 살펴보세요.',
          '장비 지도', '중장비의 마지막 확인 위치와 장비 지도', '대화형 지도에서 모든 장비의 마지막 확인 위치를 확인하세요.',
          'EquipQR에 GPS 장비가 필요한가요?', '별도의 GPS 하드웨어는 필요하지 않습니다. 작업 배치 시 이미 기록된 주소나 좌표를 사용할 수 있습니다.',
          '지도에서 예방 정비가 지연된 장비를 필터링할 수 있나요?', '팀은 장비 지도와 작업 지시 필터를 함께 사용해 근처에서 정비가 필요한 장비를 우선 처리할 수 있습니다.',
          '위치는 얼마나 자주 업데이트해야 하나요?', '정확한 경로 계획을 위해 장비가 다른 현장으로 이동할 때마다 업데이트하는 것이 좋습니다.',
          '장비 지도 이용 방법', '장비 지도는 장비 위치와 상태를 한 화면에 모아 보여줍니다.',
        ],
      },
      quickBooks: {
        content: [
          '완료된 작업을 청구서 초안으로', '완료된 작업 지시를 QuickBooks Online으로 내보내세요. 팀과 고객을 한 번 연결해두면 유상 작업 시간을 회계 소프트웨어에 다시 입력할 필요가 없습니다.',
          '이용 방법', 'QuickBooks를 연결하고 팀을 고객에 매핑한 뒤 완료된 작업을 초안으로 내보내세요.',
          'QuickBooks 내보내기', '완료된 작업 지시가 노무, 부품 및 연결된 고객 정보가 포함된 청구서 초안이 됩니다.',
          '청구서 초안 내보내기', 'QuickBooks를 연결하고 팀을 고객에 매핑해 완료된 작업을 초안으로 내보내세요.', '청구서 초안 내보내기',
        ],
        benefits: [
          ['청구서로 내보내기', '작업 지시를 청구서 초안으로', '완료된 작업 지시를 QuickBooks Online 청구서 초안으로 내보내세요. 작업 세부 내용, 노무 및 부품이 청구서에 반영됩니다. 준비되면 QuickBooks에서 검토하고 전송하세요.', '한 번에 내보내기', 'QuickBooks 청구서 초안', '내보내기 이력 및 상태'],
          ['팀과 고객 매핑', '팀을 QuickBooks 고객에 연결', '장비는 팀에 속하고 팀은 QuickBooks 고객에 매핑됩니다. 작업 지시를 내보내면 장비의 팀에 연결된 고객으로 청구서가 생성됩니다. 팀 설정에서 매핑을 한 번 구성하세요.', '팀과 QuickBooks 고객 연결', '고객 검색 및 선택', '연결 해제 후에도 매핑 유지'],
          ['조직 설정에서 연결', 'Intuit 로그인 후 고객 매핑', '조직 설정에서 OAuth로 QuickBooks를 연결하세요. Intuit 계정으로 로그인하고 EquipQR™을 승인하면 완료됩니다. 토큰이 자동 갱신되며 필요한 경우에만 다시 연결하면 됩니다.', '조직 설정에서 연결', '자동 토큰 갱신', '샌드박스 및 운영 환경'],
        ],
        steps: [
          ['QuickBooks 연결', '조직 설정 → 연동에서 QuickBooks Online을 연결하고 Intuit OAuth를 승인하세요. 조직이 QuickBooks 회사에 연결되며 연결 상태는 설정에서 확인할 수 있습니다.'],
          ['팀과 고객 매핑', '각 팀을 QuickBooks 고객에 연결하세요. 해당 팀 장비의 작업 지시는 그 고객의 청구서 초안으로 내보내집니다. 고객 검색으로 올바른 QuickBooks 고객을 선택하세요.'],
          ['작업 지시 완료', '평소처럼 작업 지시를 완료하세요. “완료” 상태의 작업만 내보낼 수 있습니다. 장비에 팀이 있고 팀에 QuickBooks 고객 매핑이 있는지 확인하세요.'],
          ['QuickBooks로 내보내기', '작업 상세에서 “QuickBooks로 내보내기”를 선택해 청구서 초안을 만드세요. 내보내기 이력을 확인하고 QuickBooks에서 청구서를 열어 청구를 관리하세요. 이미 청구서가 있으면 재내보내기가 제한됩니다.'],
        ],
        showcases: [
          ['완료된 EquipQR 작업 지시를 모바일에서 QuickBooks Online 청구서 초안으로 내보내는 애니메이션', '모바일에서 작업 지시를 QuickBooks로 내보내기', '몇 번의 터치로 완료된 EquipQR 작업 지시가 QuickBooks Online 청구서 초안이 되는 과정을 확인하세요. 노무, 부품 및 고객 매핑이 전달되어 QuickBooks에서 검토하고 보낼 수 있습니다.'],
          ['QuickBooks Online과 Google Workspace 연결 및 QR 위치 설정을 보여주는 조직 설정', '조직 설정에서 연결된 QuickBooks', '조직 설정 → 연동에서 QuickBooks Online을 연결하세요. 상태 배지는 OAuth 연결과 자동 토큰 갱신이 활성화되었음을 보여줍니다. 직접 연결 해제하지 않는 한 다시 인증할 필요가 없습니다.'],
          ['장비 정보, 예방 정비 점검 상태 및 담당자를 보여주는 완료된 작업 지시 상세', '완료된 작업을 한 번에 내보내기', '작업 지시가 완료되면 상세 페이지에서 QuickBooks로 내보내기를 선택하세요. 장비의 팀에 매핑된 고객으로 QuickBooks 회사에 청구서 초안이 생성됩니다.'],
        ],
        seo: [
          '정비소를 위한 QuickBooks 작업 지시 청구서 내보내기', '완료된 작업을 노무 및 부품 요약이 포함된 QuickBooks Online 청구서 초안으로 전송해 현장과 회계 사이의 스프레드시트 작업을 줄이세요.',
          'QuickBooks', '정비소를 위한 QuickBooks 작업 지시 청구서 내보내기', 'QuickBooks Online을 연결하고 팀을 고객에 매핑한 뒤 완료된 작업 지시를 단계별 흐름으로 청구서 초안으로 내보내세요.',
          'EquipQR은 어떤 QuickBooks 제품과 연동되나요?', 'EquipQR은 Intuit OAuth를 통해 QuickBooks Online과 연동됩니다. 관리자는 조직 설정에서 연결 및 토큰 상태를 확인할 수 있습니다.',
          '고객에게 보낼 청구서에는 어떤 내용이 포함되나요?', '내보낸 청구서에는 EquipQR 청구 규칙에 따른 노무와 부품 요약이 포함됩니다. 담당자가 QuickBooks에서 문구를 확정한 뒤 전송합니다.',
          'QuickBooks 토큰이 만료되면 다시 연결할 수 있나요?', '조직 설정의 연동 메뉴에서 다시 연결하세요. EquipQR에 저장된 팀과 고객의 매핑은 유지됩니다.',
          'QuickBooks 연동 방법', 'QuickBooks 연동은 작업 지시, 팀 및 고객을 회계 흐름과 연결합니다.',
        ],
      },
    },
  },
} as const;
