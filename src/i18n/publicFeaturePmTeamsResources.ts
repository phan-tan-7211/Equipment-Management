import { getFeatureSeoByPath } from '@/lib/featureSeoContent';
import { extractFeaturePageCopy } from '@/pages/features/data/featurePageTranslations';
import * as pm from '@/pages/features/data/pmTemplatesData';
import * as teams from '@/pages/features/data/teamCollaborationData';

export const publicFeaturePmTeamsResources = {
  en: {
    publicFeatures: {
      pmTemplates: {
        ...extractFeaturePageCopy(pm.content, pm.benefits, pm.steps, pm.showcases,
          getFeatureSeoByPath('/features/pm-templates')!),
        extra: {
          title: 'Built-in templates',
          description: '{{firstName}} is {{firstItems}} items across {{firstSections}} sections. {{secondName}} is {{secondItems}} items across {{secondSections}} sections. Assign one as-is. Clone it only if you need to change the list.',
          descriptionShort: 'Assign one as-is. Clone it only if you need to change the list.',
          items: 'items', sections: 'sections',
          templates: [
            ['Forklift PM', 'Complete inspection covering visual checks, engine, hydraulics, brakes, electrical, and safety systems.'],
            ['Excavator PM', 'Checklist for track-type excavators including undercarriage, boom, and bucket inspection.'],
            ['Scissor Lift PM', 'Safety-focused checklist covering platform, hydraulics, electrical, and emergency systems.'],
            ['Skid Steer PM', 'Full inspection template for skid steer loaders including loader arms, hydraulics, and controls.'],
            ['Pull Trailer PM', 'DOT-compliant trailer inspection covering lights, brakes, tires, and coupling systems.'],
            ['Compressor PM', 'Industrial compressor maintenance checklist for air systems, filters, and safety valves.'],
          ],
        },
      },
      teamCollaboration: {
        ...extractFeaturePageCopy(teams.content, teams.benefits, teams.steps, teams.showcases,
          getFeatureSeoByPath('/features/team-collaboration')!),
        extra: {
          title: 'Roles & Permissions',
          description: 'EquipQR uses a two-tier role system: organization-level roles that govern your whole account, and team-level roles that control access within each team.',
          orgTitle: 'Organization Roles', orgSubtitle: 'Set once per member when they join your organization.',
          teamTitle: 'Team Roles', teamSubtitle: 'Assigned independently per team, giving fine-grained control within each crew.',
          orgRoles: [
            ['Owner', 'Full account control. Manages billing, integrations, and all organization settings. Can promote or remove any member.'],
            ['Admin', 'Manages members, teams, and equipment organization-wide. Cannot change billing or owner-level settings.'],
            ['Member', 'Works within the teams they belong to. Sees only the equipment and work orders assigned to their teams.'],
          ],
          teamRoles: [
            ['Manager', 'Manages team members, equipment assignments, and QuickBooks customer mappings. Can create and close work orders.'],
            ['Technician', "Creates and updates work orders, completes PM checklists, and logs scan activity for their team's equipment."],
            ['Requestor', "Designed for trusted customers. A Requestor can scan a machine's QR code to submit a work order request directly — no phone call required."],
            ['Viewer', 'Read-only access to team equipment and work orders. Useful for customers, inspectors, or stakeholders who need visibility without edit rights.'],
          ],
        },
      },
    },
  },
  vi: {
    publicFeatures: {
      pmTemplates: {
        content: [
          'Cùng một danh sách kiểm tra trên mọi máy', 'Gắn mẫu bảo dưỡng định kỳ vào lệnh công việc để mọi kỹ thuật viên kiểm tra cùng các mục. Danh sách đã hoàn thành được lưu trên máy.',
          'Cách hoạt động', 'Chọn mẫu, thực hiện kiểm tra và lưu hồ sơ trên lệnh công việc đã đóng.',
          'Mẫu bảo dưỡng định kỳ', 'Danh sách kiểm tra có sẵn cho các loại máy phổ biến; hoặc sao chép và sửa các mục.',
          'Gắn mẫu bảo dưỡng định kỳ', 'Tạo tài khoản miễn phí và gắn danh sách kiểm tra có sẵn vào lệnh công việc tiếp theo.', 'Gắn mẫu bảo dưỡng định kỳ',
        ],
        benefits: [
          ['Cùng các mục kiểm tra mỗi lần', 'Không bỏ sót ô kiểm tra', 'Mọi kỹ thuật viên cùng thực hiện một danh sách kiểm tra. Không phải phỏng đoán hay bỏ quên mục nào. Quy trình kiểm tra thống nhất trên mọi máy.', 'Quy trình chuẩn hóa', 'Đào tạo đơn giản hơn'],
          ['Hồ sơ đầy đủ', 'Lịch sử bảo dưỡng lâu dài', 'Mọi danh sách kiểm tra đã hoàn tất được lưu trên lệnh công việc. Theo dõi nội dung đã kiểm tra, người thực hiện và thời gian. Dùng cho tuân thủ, kiểm toán và hồ sơ bảo hành.', 'Hồ sơ sẵn sàng kiểm toán', 'Bảo vệ quyền bảo hành', 'Theo dõi tuân thủ'],
          ['Sao chép và chỉnh sửa', 'Mẫu có sẵn không thay đổi cho đến khi bạn sao chép', 'Bắt đầu từ mẫu có sẵn rồi chỉnh sửa bản sao, hoặc tạo mẫu mới. Thêm nhóm, mục và mô tả phù hợp với cách xưởng thực hiện kiểm tra.', 'Mẫu tùy chỉnh', 'Nhóm mục linh hoạt', 'Phù hợp từng thiết bị'],
        ],
        steps: [
          ['Tạo lệnh công việc', 'Khi tạo lệnh công việc bảo dưỡng phòng ngừa, chọn mẫu có sẵn. Mẫu được tự động gắn vào lệnh công việc.'],
          ['Hoàn thành danh sách kiểm tra', 'Thực hiện từng mục theo nhóm. Đánh dấu đạt, báo lỗi cần xử lý hoặc ghi chú theo mục. Dùng “Đánh dấu tất cả đạt” để hoàn thành nhanh một nhóm.'],
          ['Lưu tiến độ', 'Tiến độ kiểm tra được tự động lưu. Quay lại để tiếp tục hoặc hoàn thành một lần; mọi dữ liệu được giữ đến khi lệnh công việc hoàn tất.'],
          ['Hồ sơ lâu dài', 'Khi lệnh công việc hoàn tất, danh sách kiểm tra bảo dưỡng trở thành hồ sơ lâu dài. Xem chi tiết bất kỳ lúc nào từ lịch sử lệnh hoặc hồ sơ dịch vụ thiết bị.'],
        ],
        showcases: [
          ['Video di động mô tả kỹ thuật viên tạo danh sách kiểm tra bảo dưỡng trong EquipQR', 'Tạo danh sách kiểm tra trên điện thoại', 'Tạo danh sách kiểm tra bảo dưỡng tại hiện trường bằng điện thoại. Chọn mẫu, gắn vào lệnh công việc và đánh dấu các mục bằng nút dễ chạm. Không cần máy tính xách tay.'],
          ['Danh sách sáu mẫu bảo dưỡng định kỳ có sẵn gồm xe nâng, máy đào và xe nâng cắt kéo', 'Duyệt mẫu có sẵn', 'Xem toàn bộ mẫu bảo dưỡng trong tổ chức. Mỗi thẻ hiển thị tên, mô tả, số nhóm và thao tác nhanh như Áp dụng cho thiết bị, Sao chép hoặc Cấu hình.'],
          ['Chi tiết mẫu bảo dưỡng xe nâng gồm 12 nhóm và 103 mục kiểm tra', 'Xem chi tiết mẫu', 'Mở mẫu để xem cấu trúc đầy đủ. Mẫu xe nâng có 12 nhóm và 103 mục gồm kiểm tra trực quan, động cơ, thủy lực, phanh, hệ thống điện và nhiều phần khác.'],
        ],
        seo: [
          'Mẫu bảo dưỡng và danh sách kiểm tra thiết bị hạng nặng', 'Dùng mẫu bảo dưỡng có cấu trúc cho xe nâng, máy đào, thiết bị nâng, rơ-moóc và các máy khác. Gắn vào lệnh công việc để kiểm tra nhất quán.',
          'Mẫu bảo dưỡng', 'Mẫu bảo dưỡng và danh sách kiểm tra thiết bị hạng nặng', 'Gắn mẫu bảo dưỡng cho nhiều loại máy vào lệnh công việc để kiểm tra nhất quán.',
          'Có sẵn những mẫu thiết bị nào?', 'EquipQR có mẫu cho xe nâng, máy đào, xe nâng cắt kéo, máy xúc trượt, rơ-moóc và máy nén khí; mỗi mẫu được chia thành các nhóm kiểm tra.',
          'Có thể cập nhật mẫu theo thời gian không?', 'Quản trị viên tổ chức có thể sao chép, chỉnh sửa và ngừng dùng mẫu mà vẫn giữ hồ sơ bảo dưỡng cũ trên lệnh đã đóng.',
          'Mẫu có bắt buộc ảnh làm bằng chứng không?', 'Nhân viên đính kèm ảnh theo chính sách danh sách kiểm tra bằng tính năng ảnh hiện có gắn với lệnh công việc.',
          'Cách gắn mẫu bảo dưỡng vào lệnh công việc', 'Gắn mẫu bảo dưỡng vào lệnh công việc và thực hiện danh sách kiểm tra trên lệnh đó.',
        ],
        extra: {
          title: 'Mẫu có sẵn',
          description: '{{firstName}} có {{firstItems}} mục trong {{firstSections}} nhóm. {{secondName}} có {{secondItems}} mục trong {{secondSections}} nhóm. Áp dụng nguyên mẫu hoặc sao chép nếu cần sửa danh sách.',
          descriptionShort: 'Áp dụng nguyên mẫu hoặc sao chép nếu cần sửa danh sách.',
          items: 'mục', sections: 'nhóm',
          templates: [
            ['Bảo dưỡng xe nâng', 'Kiểm tra toàn diện phần nhìn ngoài, động cơ, thủy lực, phanh, hệ thống điện và an toàn.'],
            ['Bảo dưỡng máy đào', 'Danh sách kiểm tra máy đào bánh xích gồm gầm xe, cần và gầu.'],
            ['Bảo dưỡng xe nâng cắt kéo', 'Kiểm tra an toàn sàn nâng, thủy lực, hệ thống điện và cơ chế khẩn cấp.'],
            ['Bảo dưỡng máy xúc trượt', 'Mẫu kiểm tra máy xúc trượt gồm tay nâng, thủy lực và bộ điều khiển.'],
            ['Bảo dưỡng rơ-moóc', 'Kiểm tra rơ-moóc theo DOT gồm đèn, phanh, lốp và bộ phận nối.'],
            ['Bảo dưỡng máy nén khí', 'Danh sách bảo dưỡng máy nén khí công nghiệp gồm hệ thống khí, bộ lọc và van an toàn.'],
          ],
        },
      },
      teamCollaboration: {
        content: [
          'Mỗi nhóm chỉ thấy máy của mình', 'Cho từng nhóm xem thiết bị và lệnh công việc thuộc phạm vi của họ. Vai trò quyết định ai được sửa và ai chỉ được xem.',
          'Cách hoạt động', 'Tạo nhóm, giao máy và công việc rồi theo dõi khối lượng.',
          'Nhóm và vai trò', 'Nhóm trong tổ chức, số thành viên và vai trò Quản lý / Kỹ thuật viên / Người yêu cầu / Người xem.',
          'Tạo nhóm đầu tiên', 'Tạo tài khoản miễn phí, thêm nhóm và giao những máy đầu tiên.', 'Tạo nhóm đầu tiên',
        ],
        benefits: [
          ['Nhóm phụ trách máy riêng', 'Theo vị trí, chuyên môn hoặc khách hàng', 'Tạo nhóm phù hợp cách xưởng vận hành. Giao thiết bị và lệnh công việc để thành viên chỉ thấy máy thuộc nhóm mình.', 'Thiết bị theo nhóm', 'Lệnh công việc theo nhóm'],
          ['Vai trò phù hợp công việc', 'Quản lý, kỹ thuật viên, người yêu cầu, người xem', 'Gán vai trò quản trị viên, thành viên hoặc người xem ở cấp tổ chức và nhóm. Quản trị viên quản lý cài đặt và thành viên; thành viên làm việc; người xem chỉ được đọc.', 'Vai trò tổ chức và nhóm', 'Mời và quản lý thành viên', 'Bảo mật mặc định'],
          ['Ai đang quá tải?', 'Xem khối lượng rồi phân công lại', 'Xem công việc phân bổ giữa các nhóm và kỹ thuật viên. Bộ lọc cho thấy người được giao quá nhiều việc để bạn phân công lại.', 'Bảng điều khiển nhóm', 'Khối lượng người được giao'],
        ],
        steps: [
          ['Tạo nhóm', 'Tạo nhóm theo địa điểm, chuyên môn hoặc dự án. Thêm thành viên và gán vai trò. Mỗi nhóm có thể có phạm vi thiết bị và lệnh công việc riêng.'],
          ['Giao thiết bị và công việc', 'Liên kết thiết bị với nhóm để thành viên chỉ thấy tài sản liên quan. Giao lệnh công việc cho nhóm hoặc cá nhân; dùng bộ lọc để xem khối lượng theo nhóm.'],
          ['Cộng tác theo ngữ cảnh', 'Thành viên truy cập thiết bị, lệnh công việc và bảo dưỡng từ góc nhìn của nhóm. Quản trị viên quản lý người dùng và quyền hiển thị; người xem chỉ đọc khi được cấp quyền.'],
          ['Theo dõi và cân bằng lại', 'Theo dõi tỷ lệ hoàn thành, việc quá hạn và khối lượng người được giao. Phân công lại hoặc điều chỉnh phạm vi nhóm khi cần; dùng chỉ số đội máy để cân bằng.'],
        ],
        showcases: [
          ['Danh sách tất cả nhóm cùng số thành viên và vai trò', 'Các nhóm trong tổ chức', 'Xem nhanh mọi nhóm, mô tả, số thành viên và người thuộc từng nhóm. Tạo nhóm hoặc quản lý nhóm hiện có từ một bảng điều khiển.'],
          ['Chi tiết nhóm hiển thị vai trò của các thành viên', 'Quyền truy cập nhóm theo vai trò', 'Gán vai trò Quản lý, Kỹ thuật viên, Người yêu cầu hoặc Người xem. Quản lý điều phối nhóm; kỹ thuật viên ghi nhận công việc; người yêu cầu tạo yêu cầu qua quét QR; người xem chỉ đọc. Mỗi thao tác được gắn với vai trò.'],
        ],
        seo: [
          'Vai trò và cộng tác nhóm cho tổ chức quản lý thiết bị', 'Kết hợp vai trò cấp tổ chức với vai trò Quản lý, Kỹ thuật viên, Người yêu cầu và Người xem để mỗi người thấy đúng thiết bị và công việc.',
          'Nhóm và vai trò', 'Vai trò và cộng tác nhóm cho tổ chức quản lý thiết bị', 'Vai trò tổ chức và nhóm kiểm soát quyền xem; mỗi thao tác được ghi nhận.',
          'Vai trò Người yêu cầu là gì?', 'Người yêu cầu là người được tin cậy, có thể dùng QR để gửi yêu cầu công việc mà không cần toàn bộ quyền của kỹ thuật viên.',
          'Nhóm có thể tách phạm vi thiết bị không?', 'Có. Gán thiết bị và lệnh công việc theo từng nhóm để nhóm khu vực chỉ tương tác với đội máy của mình.',
          'Có nhật ký kiểm toán không?', 'Các thao tác nhạy cảm được gắn với người thực hiện qua tính năng kiểm toán EquipQR cho quản trị viên.',
          'Cách các nhóm cộng tác trong EquipQR', 'Nhóm kết nối con người, thiết bị và lệnh công việc ở một nơi.',
        ],
        extra: {
          title: 'Vai trò và quyền', description: 'EquipQR có hai cấp vai trò: vai trò tổ chức quản lý toàn bộ tài khoản và vai trò nhóm kiểm soát quyền truy cập trong từng nhóm.',
          orgTitle: 'Vai trò tổ chức', orgSubtitle: 'Đặt một lần cho mỗi người khi tham gia tổ chức.',
          teamTitle: 'Vai trò nhóm', teamSubtitle: 'Gán độc lập theo từng nhóm để kiểm soát quyền chi tiết.',
          orgRoles: [
            ['Chủ sở hữu', 'Kiểm soát toàn bộ tài khoản, thanh toán, tích hợp và cài đặt tổ chức. Có thể thăng quyền hoặc xóa bất kỳ thành viên nào.'],
            ['Quản trị viên', 'Quản lý thành viên, nhóm và thiết bị trong tổ chức. Không thể đổi cài đặt thanh toán hoặc quyền của chủ sở hữu.'],
            ['Thành viên', 'Làm việc trong các nhóm mình tham gia. Chỉ thấy thiết bị và lệnh công việc được giao cho nhóm.'],
          ],
          teamRoles: [
            ['Quản lý', 'Quản lý thành viên nhóm, phân công thiết bị và ánh xạ khách hàng QuickBooks. Có thể tạo và đóng lệnh công việc.'],
            ['Kỹ thuật viên', 'Tạo và cập nhật lệnh công việc, hoàn thành kiểm tra bảo dưỡng và ghi lại hoạt động quét của thiết bị nhóm.'],
            ['Người yêu cầu', 'Dành cho khách hàng được tin cậy. Quét mã QR trên máy để gửi yêu cầu lệnh công việc trực tiếp, không cần gọi điện.'],
            ['Người xem', 'Chỉ đọc thiết bị và lệnh công việc của nhóm; phù hợp khách hàng, kiểm tra viên hoặc người cần theo dõi mà không có quyền sửa.'],
          ],
        },
      },
    },
  },
  ko: {
    publicFeatures: {
      pmTemplates: {
        content: [
          '모든 장비에 동일한 점검표', '예방 정비 템플릿을 작업 지시에 연결하세요. 모든 기술자가 같은 항목을 점검하고 완료된 기록은 해당 장비에 남습니다.',
          '이용 방법', '템플릿을 선택하고 점검표를 작성해 완료된 작업 기록에 보관하세요.',
          '예방 정비 템플릿', '일반 장비용 기본 점검표를 사용하거나 복제해 항목을 수정하세요.',
          '예방 정비 템플릿 연결', '무료 계정을 만들고 다음 작업 지시에 기본 점검표를 연결하세요.', '예방 정비 템플릿 연결',
        ],
        benefits: [
          ['언제나 같은 점검 항목', '누락되는 점검 항목 없이', '모든 기술자가 같은 점검표를 따릅니다. 추측하거나 빠뜨리는 항목 없이 장비마다 동일하게 검사할 수 있습니다.', '표준화된 절차', '간소화된 교육'],
          ['완전한 기록', '영구 보관되는 정비 이력', '완료된 모든 점검표는 작업 지시에 저장됩니다. 점검 내용, 담당자 및 시간을 추적해 규정 준수, 감사 및 보증 서류에 활용하세요.', '감사 준비 기록', '보증 보호', '규정 준수 추적'],
          ['복제하여 항목 수정', '복제 전에는 기본 템플릿 유지', '기본 템플릿을 복제하여 수정하거나 처음부터 새로 만드세요. 작업장에서 쓰는 점검 방식에 맞춰 구역, 항목 및 설명을 추가할 수 있습니다.', '맞춤 템플릿', '유연한 구역 구성', '장비별 설정'],
        ],
        steps: [
          ['작업 지시 생성', '예방 정비 작업 지시를 만들 때 사용 가능한 템플릿에서 하나를 고르세요. 템플릿이 작업 지시에 자동 연결됩니다.'],
          ['점검표 완료', '구역별 점검 항목을 진행하세요. 정상 표시, 문제 표시 또는 항목별 메모를 남길 수 있습니다. “모두 정상”으로 완료된 구역을 빠르게 표시하세요.'],
          ['진행 상황 저장', '점검 진행 상황은 자동으로 저장됩니다. 나중에 이어서 하거나 한 번에 마칠 수 있으며 작업 지시가 완료될 때까지 데이터가 유지됩니다.'],
          ['영구 기록', '작업 지시를 완료하면 예방 정비 점검표가 영구 기록이 됩니다. 작업 이력이나 장비 서비스 기록에서 상세 내용을 언제든 확인하세요.'],
        ],
        showcases: [
          ['기술자가 휴대폰에서 EquipQR 예방 정비 점검표를 만드는 애니메이션', '휴대폰에서 예방 정비 점검표 만들기', '현장에서 휴대폰으로 예방 정비 점검표를 만드세요. 템플릿을 작업 지시에 연결하고 터치하기 쉬운 버튼으로 항목을 처리할 수 있습니다. 노트북은 필요하지 않습니다.'],
          ['지게차, 굴착기, 시저 리프트를 포함한 기본 예방 정비 템플릿 6개 목록', '사용 가능한 템플릿 보기', '조직의 예방 정비 템플릿을 확인하세요. 각 카드에는 이름, 설명, 구역 수 및 장비에 적용, 복제, 설정 등의 빠른 작업이 표시됩니다.'],
          ['12개 구역과 103개 점검 항목이 있는 지게차 예방 정비 템플릿 상세', '템플릿 상세 보기', '템플릿의 전체 구조를 확인하세요. 지게차 템플릿은 육안 검사, 엔진, 유압, 브레이크 및 전기 시스템 등 12개 구역, 103개 항목으로 구성됩니다.'],
        ],
        seo: [
          '중장비 예방 정비 템플릿 및 점검표', '지게차, 굴착기, 리프트, 트레일러 등을 위한 체계적인 예방 정비 템플릿을 작업 지시에 연결해 일관되게 점검하세요.',
          '예방 정비 템플릿', '중장비 예방 정비 템플릿 및 점검표', '여러 장비의 예방 정비 템플릿을 작업 지시에 연결해 일관되게 점검하세요.',
          '어떤 장비 템플릿이 기본으로 제공되나요?', '지게차, 굴착기, 시저 리프트, 스키드 스티어, 트레일러 및 압축기용 기본 템플릿이 제공되며 점검 구역별로 구성됩니다.',
          '템플릿을 나중에 변경할 수 있나요?', '조직 관리자는 완료된 작업의 과거 예방 정비 기록을 유지하면서 템플릿을 복제, 개선하거나 사용 중지할 수 있습니다.',
          '예방 정비 템플릿에 사진 증빙이 필수인가요?', '작업자는 작업 지시와 연결된 기존 EquipQR 미디어 기능을 사용해 점검 정책에 따라 사진을 첨부합니다.',
          '예방 정비 템플릿을 작업 지시에 연결하는 방법', '예방 정비 템플릿을 작업 지시에 연결하고 해당 작업에서 점검표를 완료하세요.',
        ],
        extra: {
          title: '기본 템플릿',
          description: '{{firstName}}는 {{firstSections}}개 구역에 {{firstItems}}개 항목이 있습니다. {{secondName}}는 {{secondSections}}개 구역에 {{secondItems}}개 항목이 있습니다. 그대로 사용하거나 목록을 변경해야 할 때 복제하세요.',
          descriptionShort: '그대로 사용하거나 목록을 변경해야 할 때 복제하세요.',
          items: '항목', sections: '구역',
          templates: [
            ['지게차 예방 정비', '육안 검사, 엔진, 유압, 브레이크, 전기 및 안전 시스템을 포함한 종합 점검.'],
            ['굴착기 예방 정비', '하부 구조, 붐 및 버킷 검사를 포함한 궤도식 굴착기 점검표.'],
            ['시저 리프트 예방 정비', '플랫폼, 유압, 전기 및 비상 시스템을 중심으로 한 안전 점검표.'],
            ['스키드 스티어 예방 정비', '로더 암, 유압 및 조작 장치를 포함한 스키드 스티어 점검 템플릿.'],
            ['견인 트레일러 예방 정비', '조명, 브레이크, 타이어 및 연결 장치를 검사하는 DOT 준수 트레일러 점검.'],
            ['압축기 예방 정비', '공기 시스템, 필터 및 안전 밸브를 위한 산업용 압축기 정비 점검표.'],
          ],
        },
      },
      teamCollaboration: {
        content: [
          '각 팀은 담당 장비만 확인', '팀마다 담당 장비와 작업 지시를 볼 수 있게 하세요. 역할에 따라 수정하거나 조회만 할 수 있습니다.',
          '이용 방법', '팀을 만들고 장비와 작업을 배정한 뒤 업무량을 확인하세요.',
          '팀과 역할', '조직 팀, 구성원 수 및 매니저 / 기술자 / 요청자 / 조회자 역할.',
          '첫 팀 만들기', '무료 계정을 만들고 팀을 추가해 첫 장비를 배정하세요.', '첫 팀 만들기',
        ],
        benefits: [
          ['각자의 장비를 맡는 팀', '위치, 직종 또는 고객별', '실제 작업장 운영에 맞는 팀을 구성하세요. 장비와 작업 지시를 배정하면 구성원은 담당 장비만 볼 수 있습니다.', '팀별 장비 범위', '팀별 작업 지시 범위'],
          ['현장에 맞는 역할', '매니저, 기술자, 요청자, 조회자', '조직 및 팀 수준에서 관리자, 구성원 또는 조회자 역할을 지정하세요. 관리자는 설정과 구성원을 관리하고 구성원은 작업하며 조회자는 읽기 전용입니다.', '조직 및 팀 역할', '구성원 초대 및 관리', '기본 보안'],
          ['누가 과중한가요?', '업무량을 보고 재배정', '팀과 기술자별 작업 분포를 확인하세요. 필터로 업무가 과중한 담당자를 찾아 작업을 다시 배정할 수 있습니다.', '팀 대시보드', '담당자별 업무량'],
        ],
        steps: [
          ['팀 생성', '위치, 직종 또는 프로젝트에 따라 팀을 만들고 구성원과 역할을 지정하세요. 팀마다 별도의 장비 및 작업 지시 범위를 설정할 수 있습니다.'],
          ['장비와 작업 배정', '팀에 장비를 연결해 구성원이 관련 자산만 보게 하세요. 작업 지시를 팀 또는 개인에게 할당하고 필터와 대시보드에서 팀별 업무량을 확인하세요.'],
          ['관련 맥락에서 협업', '구성원은 팀 화면에서 장비, 작업 지시 및 예방 정비를 확인합니다. 관리자는 구성원과 공개 범위를 관리하고 조회자는 허용된 정보만 읽을 수 있습니다.'],
          ['추적 및 재분배', '완료율, 지연 작업 및 담당자 업무량을 추적하세요. 작업을 재배정하거나 팀 범위를 조정하고 장비 효율 및 대시보드 지표로 분배를 개선하세요.'],
        ],
        showcases: [
          ['구성원 수와 역할이 있는 모든 팀 목록', '조직의 팀', '조직의 모든 팀과 설명, 구성원 수 및 소속 인원을 한눈에 확인하세요. 한 대시보드에서 팀을 만들거나 기존 팀을 관리할 수 있습니다.'],
          ['팀 구성원별 역할 배정을 보여주는 상세 페이지', '역할 기반 팀 접근', '구성원마다 매니저, 기술자, 요청자 또는 조회자 역할을 지정하세요. 매니저는 팀 업무를 관리하고 기술자는 작업을 기록합니다. 요청자는 QR 스캔으로 작업을 요청하고 조회자는 읽기만 할 수 있습니다. 모든 작업은 역할과 함께 기록됩니다.'],
        ],
        seo: [
          '장비 조직을 위한 팀 역할과 협업', '조직 역할과 매니저, 기술자, 요청자 및 조회자 팀 역할을 결합해 각 이해관계자가 알맞은 장비와 작업을 보게 하세요.',
          '팀과 역할', '장비 조직을 위한 팀 역할과 협업', '조직 및 팀 역할로 조회 범위를 관리하고 각 작업의 수행자를 추적하세요.',
          '요청자 역할은 무엇인가요?', '요청자는 신뢰할 수 있는 고객 측 팀원으로, 기술자 전체 권한 없이 QR 기반 접수로 작업을 요청할 수 있습니다.',
          '팀별로 장비 범위를 분리할 수 있나요?', '예. 팀마다 장비와 작업 지시 범위를 할당해 지역 팀이 담당 장비에만 접근하도록 할 수 있습니다.',
          '감사 로그를 사용할 수 있나요?', '민감한 작업은 관리자가 접근 가능한 EquipQR 감사 화면을 통해 수행자를 확인할 수 있습니다.',
          'EquipQR 팀 협업 방법', '팀은 사람, 장비 및 작업 지시를 한곳에 연결합니다.',
        ],
        extra: {
          title: '역할과 권한', description: 'EquipQR은 전체 계정을 관리하는 조직 역할과 각 팀 내 접근을 관리하는 팀 역할의 두 단계 권한을 사용합니다.',
          orgTitle: '조직 역할', orgSubtitle: '구성원이 조직에 참여할 때 한 번 설정합니다.',
          teamTitle: '팀 역할', teamSubtitle: '팀마다 독립적으로 지정해 구성원별로 세밀하게 제어합니다.',
          orgRoles: [
            ['소유자', '계정 전체를 관리합니다. 결제, 연동 및 모든 조직 설정을 담당하고 구성원을 승격하거나 제거할 수 있습니다.'],
            ['관리자', '조직 전체의 구성원, 팀 및 장비를 관리합니다. 결제 또는 소유자 전용 설정은 변경할 수 없습니다.'],
            ['구성원', '소속 팀에서 작업하며 해당 팀에 할당된 장비와 작업 지시만 볼 수 있습니다.'],
          ],
          teamRoles: [
            ['매니저', '팀원, 장비 배정 및 QuickBooks 고객 매핑을 관리하고 작업 지시를 만들고 완료할 수 있습니다.'],
            ['기술자', '작업 지시를 만들고 업데이트하며 예방 정비 점검표를 완료하고 팀 장비의 스캔 활동을 기록합니다.'],
            ['요청자', '신뢰할 수 있는 고객을 위한 역할입니다. 장비의 QR 코드를 스캔해 전화 없이 작업 지시를 요청할 수 있습니다.'],
            ['조회자', '팀 장비와 작업 지시를 읽기 전용으로 봅니다. 수정 권한 없이 현황이 필요한 고객, 검사관 및 관계자에게 적합합니다.'],
          ],
        },
      },
    },
  },
} as const;
