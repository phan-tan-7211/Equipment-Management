import { getFeatureSeoByPath } from '@/lib/featureSeoContent';
import { extractFeaturePageCopy } from '@/pages/features/data/featurePageTranslations';
import * as qr from '@/pages/features/data/qrCodeIntegrationData';
import * as work from '@/pages/features/data/workOrderManagementData';
import * as inventory from '@/pages/features/data/inventoryManagementData';
import * as parts from '@/pages/features/data/partLookupAlternatesData';

const englishCopy = (page: typeof qr | typeof work | typeof inventory | typeof parts, path: string) =>
  extractFeaturePageCopy(page.content, page.benefits, page.steps, page.showcases, getFeatureSeoByPath(path)!);

export const publicFeatureOpsResources = {
  en: { publicFeatures: {
    qrCodeIntegration: englishCopy(qr, '/features/qr-code-integration'),
    workOrderManagement: englishCopy(work, '/features/work-order-management'),
    inventoryManagement: {
      ...englishCopy(inventory, '/features/inventory'),
      capabilitiesTitle: inventory.content.capabilitiesTitle,
      capabilitiesDescription: inventory.content.capabilitiesDescription,
      capabilities: inventory.capabilities.map(({ name, description }) => [name, description]),
    },
    partLookupAlternates: {
      ...englishCopy(parts, '/features/part-lookup-alternates'),
      capabilitiesTitle: parts.content.capabilitiesTitle,
      capabilitiesDescription: parts.content.capabilitiesDescription,
      capabilities: parts.capabilities.map(({ name, description }) => [name, description]),
    },
  } },
  vi: { publicFeatures: {
    qrCodeIntegration: {
      content: [
        'Quét một lần, mở hồ sơ thiết bị',
        'Kỹ thuật viên quét nhãn để mở đúng thiết bị cùng lịch sử, lệnh công việc và danh sách kiểm tra bảo dưỡng. Không cần nhập số sê-ri ngoài bãi.',
        'Cách hoạt động', 'In nhãn, dán lên máy rồi quét khi làm việc.',
        'Nhãn QR', 'In từ hồ sơ thiết bị và quét bằng camera điện thoại bất kỳ.',
        'In những nhãn đầu tiên', 'Tạo tài khoản miễn phí, tạo nhãn và dán lên đội máy.', 'In những nhãn đầu tiên',
      ],
      benefits: [
        ['Quét nhãn', 'Một lần quét, toàn bộ lịch sử', 'Quét nhãn QR trên máy để mở chi tiết, lịch sử bảo dưỡng và lệnh công việc đang mở. Không cần nhập số sê-ri ngoài bãi.', 'Không cần tìm số sê-ri', 'Xem lịch sử trên điện thoại'],
        ['Mỗi lượt quét đều được ghi nhận', 'Biết ai đã mở thiết bị và khi nào', 'Có thể ghi lại từng lượt quét để biết thời điểm thiết bị được mở, đồng thời liên kết lượt quét với điểm danh lệnh công việc hoặc lần hoàn thành bảo dưỡng định kỳ.', 'Quét để mở lệnh công việc', 'Liên kết điểm danh và bảo dưỡng'],
        ['In nhãn', 'Dán lên cả đội máy', 'Tạo nhãn QR cho thiết bị và vật tư ngay trong ứng dụng. Chọn kích thước phù hợp để in, dán lên máy và bắt đầu quét.', 'Nhãn thiết bị và phụ tùng', 'In từ hồ sơ'],
      ],
      steps: [
        ['Tạo nhãn QR', 'Tạo mã QR từ trang chi tiết thiết bị hoặc vật tư. In nhãn ở kích thước mong muốn và dán lên tài sản, kệ hoặc phụ tùng.'],
        ['Quét tại hiện trường', 'Dùng camera điện thoại hoặc trình quét QR trong ứng dụng. Lượt quét mở trang thiết bị hoặc vật tư tương ứng. Có thể cấu hình liên kết công khai để không yêu cầu đăng nhập.'],
        ['Xem thông tin và lịch sử', 'Xem thông số, lịch sử bảo dưỡng, lệnh công việc đang hoạt động và tài liệu liên quan. Khi đã đăng nhập, có thể tạo hoặc nhận lệnh công việc ngay trên màn hình đó.'],
      ],
      showcases: [
        ['Hộp thoại mã QR thiết bị EquipQR với mã có thể quét, URL thiết bị và lựa chọn tải xuống', 'Mã QR của thiết bị', 'Mỗi thiết bị có mã QR riêng. Kỹ thuật viên quét bằng camera điện thoại để mở thông tin, lịch sử bảo dưỡng và lệnh công việc đang hoạt động mà không cần tải ứng dụng.'],
        ['Danh sách thiết bị EquipQR với nút mã QR trên từng thẻ, nhóm phụ trách và ngày bảo dưỡng gần nhất', 'Truy cập nhanh từ danh sách thiết bị', 'Mỗi thẻ thiết bị có nút mã QR. Xem, tải xuống hoặc in mã ngay trong danh sách mà không cần mở từng trang chi tiết.'],
      ],
      seo: [
        'Theo dõi thiết bị bằng mã QR cho xưởng sửa chữa máy hạng nặng',
        'Quét mã QR thiết bị bằng điện thoại để xem lịch sử dịch vụ, lệnh công việc và danh sách bảo dưỡng định kỳ. Tạo nhãn QR để in cho đội máy.',
        'Theo dõi bằng mã QR', 'Theo dõi thiết bị bằng mã QR cho xưởng sửa chữa máy hạng nặng',
        'Quét mã QR thiết bị bằng điện thoại để xem lịch sử dịch vụ, lệnh công việc và danh sách bảo dưỡng định kỳ. Tạo nhãn QR để in cho đội máy.',
        'Kỹ thuật viên có cần cài ứng dụng để quét mã QR không?', 'Kỹ thuật viên có thể dùng ứng dụng web EquipQR trên trình duyệt điện thoại hoặc camera tích hợp tùy thiết bị. Nhãn QR chứa URL HTTPS dẫn thẳng đến luồng phù hợp sau khi đăng nhập.',
        'Quét QR có thể kết nối khách hàng với yêu cầu dịch vụ không?', 'EquipQR hỗ trợ các luồng dùng QR để người quét mở trải nghiệm phù hợp với vai trò, cấu hình tổ chức và nhóm được phân công.',
        'EquipQR có miễn phí cho xưởng sửa chữa máy hạng nặng không?', 'EquipQR có gói miễn phí dành cho xưởng sửa chữa, với số người dùng không giới hạn và hạn mức hợp lý như dung lượng lưu trữ. Có thể mở rộng khi nhu cầu tăng.',
        'Cách theo dõi bằng mã QR trong EquipQR', 'In nhãn, dán lên máy rồi quét khi làm việc.',
      ],
    },
    workOrderManagement: {
      content: [
        'Mọi công việc đều có trên bảng theo dõi', 'Trạng thái, người được giao và hạn hoàn thành nằm trong lệnh công việc. Nhóm tại xưởng biết việc nào đang mở mà không cần gọi văn phòng.',
        'Cách hoạt động', 'Tạo việc, giao người phụ trách rồi đóng lệnh. Danh sách kiểm tra bảo dưỡng và phụ tùng cùng nằm trên một hồ sơ.',
        'Bảng lệnh công việc', 'Lọc theo trạng thái, ưu tiên hoặc người được giao. Mở lệnh để hoàn tất danh sách kiểm tra.',
        'Tạo lệnh công việc đầu tiên', 'Mở lệnh cho một thiết bị, phân công và lưu lịch sử trên chính thiết bị đó.', 'Tạo lệnh công việc đầu tiên',
      ],
      benefits: [
        ['Phân công công việc', 'Giao cho kỹ thuật viên hoặc nhóm rồi xác nhận', 'Giao lệnh công việc cho kỹ thuật viên hoặc nhóm. Người được giao chấp nhận trước khi bắt đầu; có thể giao lại nếu họ không nhận được.', 'Giao cho nhóm hoặc cá nhân', 'Xác nhận trước khi bắt đầu'],
        ['Trạng thái trên bảng', 'Nháp, đang mở, hoàn tất, đã hủy', 'Lọc theo trạng thái, mức ưu tiên, thiết bị hoặc người được giao. Danh sách kiểm tra bảo dưỡng, phụ tùng và ghi chú đều nằm trong lệnh công việc.', 'Lọc theo trạng thái và ưu tiên', 'Bảo dưỡng, phụ tùng và ghi chú'],
        ['Hạn hoàn thành và quá hạn', 'Việc khẩn cấp được ưu tiên', 'Đặt hạn hoàn thành và mức ưu tiên. Bộ lọc và bảng điều khiển cho thấy công việc đã quá hạn hoặc sắp đến hạn trong tuần.', 'Hạn và mức ưu tiên', 'Việc quá hạn trên bảng điều khiển'],
      ],
      steps: [
        ['Tạo lệnh công việc', 'Liên kết lệnh với thiết bị, thêm mô tả và tùy chọn gắn mẫu bảo dưỡng định kỳ. Đặt ưu tiên, hạn hoàn thành và giao cho kỹ thuật viên hoặc nhóm.'],
        ['Phân công và xác nhận', 'Người được giao nhận thông báo và có thể chấp nhận hoặc từ chối. Khi chấp nhận, họ xem được toàn bộ lệnh cùng danh sách kiểm tra, phụ tùng và thông tin thiết bị.'],
        ['Thực hiện công việc', 'Đi qua danh sách kiểm tra, ghi phụ tùng đã dùng, thêm ghi chú hoặc ảnh và cập nhật trạng thái. Tiến độ được lưu tự động để không bị mất.'],
        ['Đóng lệnh và lưu hồ sơ', 'Đánh dấu hoàn thành. Hồ sơ bảo dưỡng định kỳ và lịch sử dịch vụ được lưu trên thiết bị để đối chiếu và sử dụng sau này.'],
      ],
      showcases: [
        ['Danh sách lệnh công việc với bộ lọc trạng thái, mức ưu tiên và người được giao', 'Danh sách lệnh công việc', 'Xem tất cả lệnh và lọc theo trạng thái, ưu tiên, người được giao hoặc thiết bị. Phát hiện việc quá hạn, mở chi tiết và tạo công việc mới ngay tại đây.'],
        ['Trang chi tiết lệnh công việc với thiết bị, người được giao và danh sách kiểm tra bảo dưỡng', 'Chi tiết lệnh và danh sách kiểm tra bảo dưỡng', 'Mở lệnh để xem thiết bị, người được giao, hạn và mẫu bảo dưỡng đính kèm. Hoàn thành các mục kiểm tra, thêm phụ tùng, ghi chú và ảnh rồi đóng lệnh.'],
      ],
      seo: [
        'Phần mềm quản lý lệnh công việc cho sửa chữa máy hạng nặng', 'Tạo, phân công và hoàn thành lệnh công việc trong xưởng với mẫu bảo dưỡng định kỳ, phụ tùng, ảnh và trạng thái phù hợp với nhóm hiện trường.',
        'Lệnh công việc', 'Phần mềm quản lý lệnh công việc cho sửa chữa máy hạng nặng', 'Tạo, phân công và hoàn thành lệnh công việc trong xưởng với mẫu bảo dưỡng định kỳ, phụ tùng, ảnh và trạng thái phù hợp với nhóm hiện trường.',
        'Lệnh công việc có thể kèm danh sách kiểm tra bảo dưỡng định kỳ không?', 'Có. Gắn mẫu bảo dưỡng để kỹ thuật viên kiểm tra nhất quán và người quản lý theo dõi các mục quá hạn trên bảng điều khiển.',
        'Xuất QuickBooks liên quan thế nào đến lệnh công việc?', 'Có thể xuất lệnh đã hoàn thành thành hóa đơn nháp QuickBooks Online khi đã cấu hình tích hợp. Các dòng thanh toán tổng hợp giúp giảm nhập liệu lặp lại.',
        'EquipQR có hỗ trợ phân công theo nhóm không?', 'Có thể giao lệnh cho nhóm hoặc kỹ thuật viên riêng lẻ, kèm bước xác nhận để việc điều phối có người chịu trách nhiệm.',
        'Luồng xử lý lệnh công việc trong EquipQR', 'Lệnh công việc kết nối thiết bị, nhóm, mẫu bảo dưỡng định kỳ và kho vật tư trong một quy trình.',
      ],
    },
    inventoryManagement: {
      content: [
        'Có sẵn phụ tùng trước khi bắt đầu việc', 'Theo dõi tồn kho, nhập và xuất vật tư. Liên kết phụ tùng với thiết bị để kỹ thuật viên chọn đúng món cho lệnh công việc.',
        'Cách hoạt động', 'Nhập phụ tùng, xuất dùng cho lệnh công việc và đặt mua lại khi tồn kho giảm.',
        'Kho phụ tùng', 'Mức tồn, ngưỡng cảnh báo và lịch sử giao dịch của từng vật tư.',
        'Thêm phụ tùng đầu tiên', 'Tạo tài khoản miễn phí và theo dõi tồn kho cho công việc sắp tới.', 'Thêm phụ tùng đầu tiên',
      ],
      capabilitiesTitle: 'Kho vật tư theo dõi những gì',
      capabilitiesDescription: 'Danh mục, giao dịch, khả năng tương thích và cảnh báo sắp hết hàng trong một nơi.',
      capabilities: [
        ['Danh mục phụ tùng', 'Quản lý danh mục phụ tùng và vật tư tập trung với mã, mô tả và nhà cung cấp ưu tiên.'],
        ['Lịch sử giao dịch', 'Theo dõi mọi lần nhập, xuất và điều chỉnh cùng nhật ký kiểm tra. Biết ai đã chuyển món gì, khi nào.'],
        ['Quy tắc tương thích', 'Xác định phụ tùng phù hợp với thiết bị nào. Liên kết vật tư với hãng, mẫu máy hoặc loại thiết bị cụ thể.'],
        ['Cảnh báo tồn kho thấp', 'Đặt số lượng tối thiểu và nhận thông báo khi tồn kho xuống dưới ngưỡng. Đặt hàng trước khi công việc bị đình trệ.'],
        ['Liên kết thiết bị', 'Liên kết vật tư với thiết bị để tra cứu nhanh khi làm lệnh công việc hoặc bảo dưỡng định kỳ.'],
      ],
      benefits: [
        ['Trên kệ còn gì', 'Nhập, xuất và số lượng hiện tại', 'Theo dõi số lượng ở nhiều vị trí, ghi lại từng lần nhập, xuất và điều chỉnh. Xem tồn kho hiện tại hoặc mở lịch sử giao dịch của từng món.', 'Cập nhật số lượng tức thời', 'Nhật ký giao dịch', 'Hỗ trợ nhiều vị trí'],
        ['Cảnh báo tồn kho thấp', 'Đặt mua lại trước khi công việc bị đình trệ', 'Đặt số lượng tối thiểu cho từng vật tư và nhận thông báo khi tồn kho xuống dưới ngưỡng. Đặt mua trước khi máy phải chờ phụ tùng.', 'Ngưỡng tùy chỉnh', 'Thông báo trong ứng dụng', 'Theo dõi nhu cầu đặt lại'],
        ['Phụ tùng nào hợp với máy này', 'Liên kết phụ tùng với thiết bị', 'Đặt quy tắc tương thích để kỹ thuật viên thấy vật tư phù hợp với máy đang xử lý. Có thể ghi nhận phụ tùng liên kết đã dùng ngay trên lệnh công việc.', 'Quy tắc hãng và mẫu máy', 'Phụ tùng theo thiết bị', 'Tích hợp lệnh công việc'],
      ],
      steps: [
        ['Thêm vật tư', 'Tạo vật tư với mã, mô tả và số lượng tối thiểu/tối đa nếu cần. Sắp xếp theo danh mục hoặc trường tùy chỉnh phù hợp kho của bạn.'],
        ['Ghi giao dịch', 'Ghi nhập khi hàng về, xuất khi dùng và điều chỉnh khi kiểm kê hoặc sửa số liệu. Mỗi thay đổi đều có thời gian và người thực hiện.'],
        ['Liên kết thiết bị', 'Thiết lập quy tắc tương thích để đúng phụ tùng xuất hiện cho từng loại thiết bị. Dùng tra cứu và phụ tùng thay thế khi tạo lệnh công việc để lấy vật tư nhanh.'],
        ['Chủ động trước khi hết hàng', 'Dựa vào cảnh báo tồn kho thấp để đặt mua trước khi cạn. Xem bảng điều khiển và báo cáo để phân tích mức sử dụng và lập kế hoạch bổ sung.'],
      ],
      showcases: [
        ['Danh sách vật tư hiển thị phụ tùng, mức tồn kho, SKU và dấu hiệu sắp hết hàng', 'Danh sách vật tư', 'Xem phụ tùng cùng mã, mô tả, mức tồn và cảnh báo sắp hết hàng. Lọc, sắp xếp và tìm kiếm để nhanh chóng tìm đúng món.'],
        ['Chi tiết vật tư hiển thị số lượng tồn, ngưỡng, đơn giá và tab lịch sử giao dịch', 'Chi tiết vật tư và tồn kho', 'Mở vật tư để xem số lượng hiện có, ngưỡng tồn thấp, đơn giá, quy tắc tương thích và toàn bộ lịch sử giao dịch. Điều chỉnh tồn kho hoặc nhập hàng tại đây.'],
      ],
      seo: [
        'Quản lý kho phụ tùng và cảnh báo tồn kho cho xưởng sửa chữa', 'Theo dõi phụ tùng, nhập xuất và cảnh báo tồn kho thấp cùng nhật ký giao dịch liên kết với quy tắc tương thích thiết bị và lệnh công việc.',
        'Kho vật tư', 'Quản lý kho phụ tùng và cảnh báo tồn kho cho xưởng sửa chữa', 'Theo dõi phụ tùng và vật tư với mức tồn, cảnh báo sắp hết hàng và quy tắc tương thích để kỹ thuật viên chọn đúng món cho mỗi việc.',
        'Có thể liên kết kho vật tư với khả năng tương thích thiết bị không?', 'Có. Xác định liên kết tương thích để phụ tùng ưu tiên xuất hiện khi kỹ thuật viên ghi nhận vật tư dùng trong lệnh công việc.',
        'Cảnh báo tồn kho thấp có thông báo cho nhóm không?', 'EquipQR đánh dấu các ngưỡng tồn kho thấp trên bảng điều khiển để người mua hàng đặt lại trước khi công việc bị chậm.',
        'Kho vật tư có hỗ trợ mã vạch hoặc QR không?', 'EquipQR dùng nhãn QR để định danh cả thiết bị và kệ vật tư, giúp quét nhanh khi nhập và xuất.',
        'Cách quản lý kho vật tư', 'Kho vật tư kết nối việc nhập, xuất và cảnh báo với quy trình gắn theo từng thiết bị.',
      ],
    },
    partLookupAlternates: {
      content: [
        'Dùng phụ tùng đang có trên kệ', 'Tìm mã phụ tùng, xem tồn kho và món thay thế đã duyệt. Đưa món thay thế vào lệnh công việc khi SKU ưu tiên đã hết.',
        'Cách hoạt động', 'Tìm mã, so sánh các lựa chọn thay thế rồi dùng món đang có cho công việc.',
        'Tra cứu phụ tùng', 'Tìm theo mã phụ tùng, mã OEM hoặc mô tả. Kết quả hiển thị tồn kho, món thay thế và giá.',
        'Tra cứu mã phụ tùng đầu tiên', 'Tạo tài khoản miễn phí và tìm phụ tùng thay thế trong kho cho công việc tới.', 'Tra cứu mã phụ tùng đầu tiên',
      ],
      capabilitiesTitle: 'Tra cứu hỗ trợ những gì',
      capabilitiesDescription: 'Tìm kiếm, so sánh và thay thế phụ tùng trong kho và danh mục.',
      capabilities: [
        ['Tìm theo mã phụ tùng', 'Tìm theo mã, mô tả hoặc từ khóa trong kho. Ghép gần đúng nhanh giúp tìm được món cần ngay cả khi chỉ có một phần mã.'],
        ['Nhóm phụ tùng thay thế', 'Xác định các nhóm phụ tùng có thể thay thế cho nhau. Khi một món hết hàng, nhanh chóng xem những món thay thế đã duyệt.'],
        ['Tham chiếu chéo', 'Liên kết mã OEM, hàng thay thế và mã của nhà sản xuất. Tra cứu bằng mã bất kỳ để xem tất cả phụ tùng liên quan.'],
        ['Tình trạng tồn kho', 'Xem mức tồn và vị trí hiện tại của từng phụ tùng cùng món thay thế. Biết ngay món nào có thể dùng cho lệnh công việc.'],
        ['Tích hợp danh mục', 'Tìm trong danh mục bên ngoài và nguồn phụ tùng thay thế bên cạnh kho của bạn. So sánh hàng sẵn và giá trước khi đặt mua.'],
      ],
      benefits: [
        ['Tìm theo mã phụ tùng', 'Kho, món thay thế và mã OEM', 'Tìm theo mã phụ tùng, mô tả hoặc nhà sản xuất. Kết quả gồm kho vật tư, nhóm thay thế và tham chiếu chéo để không bỏ sót lựa chọn phù hợp.', 'Kết quả tìm kiếm nhanh', 'Ghép gần đúng', 'Tra cứu nhiều danh mục'],
        ['Dùng món thay thế có sẵn', 'Món thay thế đã duyệt và có tồn kho', 'Tạo nhóm phụ tùng có thể thay thế cho nhau. Khi món ưu tiên hết, xem lựa chọn đã duyệt cùng số lượng tồn rồi dùng trên lệnh công việc mà không cần đoán.', 'Chỉ món thay thế đã duyệt', 'Thay thế với một thao tác', 'Giảm thời gian chờ'],
        ['So sánh tồn kho và giá', 'Quyết định dựa trên dữ liệu', 'Xem tồn kho và giá hiện tại của từng món cùng lựa chọn thay thế. So sánh trước khi đưa vào lệnh công việc hoặc đặt mua.', 'Xem mức tồn', 'So sánh giá', 'Đặt mua hợp lý hơn'],
      ],
      steps: [
        ['Tìm theo mã phụ tùng', 'Nhập mã, mô tả hoặc từ khóa trong Tra cứu phụ tùng. Kết quả gồm vật tư phù hợp, nhóm thay thế và tham chiếu chéo. Lọc theo tồn kho hoặc tương thích thiết bị nếu cần.'],
        ['Xem món thay thế và tồn kho', 'Mở phụ tùng để xem nhóm thay thế và số lượng tồn. So sánh hàng sẵn và giá của món ưu tiên với các món thay thế. Dùng hàng có sẵn hoặc lên kế hoạch đặt lại.'],
        ['Dùng trong lệnh công việc', 'Khi thêm phụ tùng vào lệnh, tìm qua Tra cứu phụ tùng hoặc chọn từ kho liên kết với thiết bị. Nếu món chính hết, chọn món thay thế. Lượng đã dùng và lịch sử luôn chính xác.'],
        ['Quản lý nhóm thay thế', 'Tạo và cập nhật các nhóm phụ tùng thay thế trong ứng dụng. Thêm hoặc xóa món tương đương, chọn món ưu tiên và cập nhật tham chiếu chéo. Tra cứu luôn dùng dữ liệu mới nhất.'],
      ],
      showcases: [
        ['Trang Tra cứu phụ tùng với tab tìm theo mã và gợi ý tìm kiếm mẫu', 'Tìm theo mã phụ tùng hoặc hãng/mẫu máy', 'Nhập mã OEM, mã hàng thay thế hoặc mã nội bộ để xem vật tư phù hợp, nhóm thay thế và tham chiếu chéo cạnh nhau. Chuyển sang tab Hãng/Mẫu máy để lọc theo loại thiết bị.'],
      ],
      seo: [
        'Tra cứu phụ tùng và nhóm thay thế cho xưởng thiết bị', 'Tìm phụ tùng OEM và hàng thay thế, so sánh lựa chọn rồi đưa món thay thế vào lệnh công việc khi hàng ưu tiên hết.',
        'Tra cứu phụ tùng', 'Tra cứu phụ tùng và nhóm thay thế cho xưởng thiết bị', 'Tìm nhanh phụ tùng, so sánh lựa chọn thay thế và giữ năng suất khi SKU ưu tiên không còn hàng.',
        'Tra cứu phụ tùng kết nối với kho như thế nào?', 'Kết quả tra cứu hiển thị số lượng tồn hiện tại cùng nhóm thay thế để người lập kế hoạch biết hàng sẵn trước khi xuất cho kỹ thuật viên.',
        'Xưởng có thể tự quản lý mối quan hệ thay thế không?', 'Có. Nhóm thay thế lưu ánh xạ giữa mã OEM và hàng thay thế, đồng thời cho phép quản lý món ưu tiên.',
        'Có thể tìm bằng một phần từ khóa không?', 'Kỹ thuật viên có thể bắt đầu nhập mô tả hoặc mã rồi thu hẹp kết quả bằng bộ lọc theo tính tương thích thiết bị.',
        'Cách tra cứu phụ tùng', 'Tra cứu và món thay thế kết nối với kho vật tư và lệnh công việc để đưa món tìm được vào sử dụng.',
      ],
    },
  } },
  ko: { publicFeatures: {
    qrCodeIntegration: {
      content: [
        '한 번 스캔으로 장비 정보 열기', '기술자가 라벨을 스캔하면 해당 장비의 이력, 작업 지시, 예방 정비 점검표가 열립니다. 현장에서 일련번호를 입력할 필요가 없습니다.',
        '이용 방법', '라벨을 인쇄해 장비에 붙이고 작업 중 스캔하세요.',
        'QR 라벨', '장비 기록에서 인쇄하고 스마트폰 카메라로 스캔하세요.',
        '첫 라벨 인쇄', '무료 계정을 만들고 라벨을 생성해 장비에 부착하세요.', '첫 라벨 인쇄',
      ],
      benefits: [
        ['라벨 스캔', '한 번의 스캔으로 전체 이력 확인', '장비의 QR 라벨을 스캔해 세부 정보, 정비 이력 및 진행 중인 작업 지시를 여세요. 현장에서 일련번호를 입력하지 않아도 됩니다.', '일련번호 검색 불필요', '스마트폰으로 이력 확인'],
        ['스캔 기록 남기기', '누가 언제 열었는지 확인', '각 스캔을 기록해 장비를 연 시점을 파악하고 작업 지시 체크인이나 완료된 예방 정비와 연결할 수 있습니다.', '스캔으로 작업 지시 열기', '체크인 및 예방 정비 연결'],
        ['라벨 인쇄', '장비 전체에 부착', '앱에서 장비와 재고 품목의 QR 라벨을 생성하세요. 알맞은 크기로 인쇄해 장비에 붙이고 바로 스캔할 수 있습니다.', '장비 및 부품 라벨', '기록에서 바로 인쇄'],
      ],
      steps: [
        ['QR 라벨 생성', '장비 또는 재고 상세 화면에서 QR 코드를 생성하세요. 원하는 크기로 인쇄해 자산, 보관함 또는 부품에 붙입니다.'],
        ['현장에서 스캔', '스마트폰 카메라 또는 앱의 QR 스캐너로 라벨을 스캔하세요. 해당 장비나 품목 페이지가 열립니다. 공개 링크로 설정하면 로그인 없이 열 수 있습니다.'],
        ['세부 정보와 이력 확인', '사양, 정비 이력, 진행 중인 작업 지시 및 연결된 문서를 확인하세요. 로그인한 상태라면 같은 화면에서 작업 지시를 만들거나 수락할 수 있습니다.'],
      ],
      showcases: [
        ['스캔 가능한 QR 코드와 장비 URL 및 다운로드 옵션을 보여주는 EquipQR 장비 QR 코드 창', '장비 QR 코드', '장비마다 고유 QR 코드가 생성됩니다. 기술자가 스마트폰 카메라로 코드를 스캔하면 장비 정보, 정비 이력 및 진행 중인 작업 지시가 열립니다. 앱을 내려받을 필요가 없습니다.'],
        ['장비별 QR 버튼과 담당 팀 및 최근 정비일을 보여주는 EquipQR 장비 목록', '장비 목록에서 빠르게 접근', '모든 장비 카드에 QR 코드 버튼이 있습니다. 각각의 상세 페이지를 열지 않고도 목록에서 코드를 확인, 다운로드 또는 인쇄할 수 있습니다.'],
      ],
      seo: [
        '중장비 정비소를 위한 QR 코드 장비 추적', '스마트폰으로 장비 QR 코드를 스캔해 서비스 이력, 작업 지시 및 예방 정비 점검표를 여세요. 장비용 QR 라벨도 인쇄할 수 있습니다.',
        'QR 코드 추적', '중장비 정비소를 위한 QR 코드 장비 추적', '스마트폰으로 장비 QR 코드를 스캔해 서비스 이력, 작업 지시 및 예방 정비 점검표를 여세요. 장비용 QR 라벨도 인쇄할 수 있습니다.',
        '기술자가 QR 코드를 스캔하려면 앱을 설치해야 하나요?', '스마트폰 브라우저에서 EquipQR 웹 앱을 사용하거나 기기 설정에 따라 내장 카메라로 스캔할 수 있습니다. QR 스티커의 HTTPS URL은 로그인 후 해당 작업 화면으로 연결됩니다.',
        'QR 스캔으로 고객의 서비스 요청을 연결할 수 있나요?', 'EquipQR은 조직 설정과 팀 배정에 따라 QR을 스캔한 사용자를 역할에 맞는 화면으로 안내하는 워크플로를 지원합니다.',
        '중장비 정비소에서 EquipQR을 무료로 쓸 수 있나요?', 'EquipQR에는 정비소를 위한 무료 요금제가 있습니다. 사용자 수는 제한하지 않으며 저장 용량 등 합리적인 한도가 적용됩니다. 필요에 따라 용량을 확장할 수 있습니다.',
        'EquipQR에서 QR 코드 추적을 사용하는 방법', '라벨을 인쇄해 장비에 붙이고 작업 중 스캔하세요.',
      ],
    },
    workOrderManagement: {
      content: [
        '모든 작업을 현황판에서 확인', '상태, 담당자 및 기한이 작업 지시에 표시됩니다. 현장 팀도 사무실에 전화하지 않고 진행 중인 일을 파악할 수 있습니다.',
        '이용 방법', '작업을 만들고 담당자를 지정한 뒤 완료하세요. 예방 정비 점검표와 부품도 같은 기록에 남습니다.',
        '작업 지시 현황판', '상태, 우선순위 또는 담당자로 필터링하고 작업을 열어 점검표를 완료하세요.',
        '첫 작업 지시 만들기', '장비에 작업을 만들고 담당자를 지정해 해당 장비의 이력으로 보관하세요.', '첫 작업 지시 만들기',
      ],
      benefits: [
        ['작업 배정', '기술자 또는 팀에 배정하고 수락받기', '작업 지시를 기술자나 팀에 배정하세요. 담당자는 시작 전에 수락하며, 맡을 수 없다면 다른 사람에게 재배정할 수 있습니다.', '팀 또는 개인 배정', '작업 시작 전 수락'],
        ['현황판의 상태', '초안, 진행 중, 완료, 취소', '상태, 우선순위, 장비 또는 담당자로 필터링하세요. 예방 정비 점검표, 부품 및 메모가 같은 작업 지시에 담깁니다.', '상태 및 우선순위 필터', '예방 정비, 부품 및 메모'],
        ['기한과 지연 작업', '긴급 작업 먼저 확인', '기한과 우선순위를 설정하세요. 필터와 대시보드에서 기한이 지났거나 이번 주에 다가오는 작업을 볼 수 있습니다.', '기한 및 우선순위', '대시보드의 지연 작업'],
      ],
      steps: [
        ['작업 지시 만들기', '작업 지시를 장비와 연결하고 설명을 추가하세요. 예방 정비 템플릿을 선택적으로 붙이고 우선순위, 기한 및 담당 기술자나 팀을 지정합니다.'],
        ['배정 및 수락', '담당자에게 알림이 전송되고 수락하거나 거절할 수 있습니다. 수락 후에는 예방 정비 점검표, 부품 및 장비 정보가 포함된 전체 작업 지시를 확인합니다.'],
        ['작업 수행', '점검표를 진행하며 사용 부품을 기록하고 메모나 사진을 추가한 뒤 상태를 갱신하세요. 진행 상황은 자동 저장됩니다.'],
        ['완료 및 기록', '작업 지시를 완료로 표시하세요. 예방 정비 기록과 서비스 이력이 장비에 보관되어 규정 준수 확인과 향후 작업에 활용할 수 있습니다.'],
      ],
      showcases: [
        ['상태, 우선순위 및 담당자별 필터가 있는 작업 지시 목록', '작업 지시 목록', '상태, 우선순위, 담당자 또는 장비별로 모든 작업을 필터링하세요. 지연된 항목을 찾고 세부 정보를 열거나 같은 화면에서 새 작업을 만들고 배정할 수 있습니다.'],
        ['장비 정보, 담당자 및 예방 정비 점검표가 있는 작업 지시 상세 화면', '작업 지시 상세 및 예방 정비 점검표', '작업을 열어 장비, 담당자, 기한 및 예방 정비 템플릿을 확인하세요. 점검표 항목을 완료하고 부품, 메모 및 사진을 추가한 뒤 작업을 완료 처리합니다.'],
      ],
      seo: [
        '중장비 수리를 위한 작업 지시 관리 소프트웨어', '현장 팀에 맞는 예방 정비 템플릿, 부품, 사진 및 상태를 활용해 정비소 작업 지시를 생성, 배정 및 완료하세요.',
        '작업 지시', '중장비 수리를 위한 작업 지시 관리 소프트웨어', '현장 팀에 맞는 예방 정비 템플릿, 부품, 사진 및 상태를 활용해 정비소 작업 지시를 생성, 배정 및 완료하세요.',
        '작업 지시에 예방 정비 점검표를 포함할 수 있나요?', '네. 예방 정비 템플릿을 붙여 기술자가 일관되게 점검하고 관리자가 대시보드에서 지연 항목을 확인할 수 있습니다.',
        'QuickBooks 내보내기는 작업 지시와 어떻게 연결되나요?', '연동을 설정하면 완료된 작업을 QuickBooks Online의 임시 청구서로 내보낼 수 있습니다. 청구 항목 요약으로 중복 입력을 줄입니다.',
        'EquipQR에서 팀에 작업을 배정할 수 있나요?', '팀 또는 개별 기술자에게 작업을 배정하고 수락 절차를 거쳐 담당자를 명확히 할 수 있습니다.',
        'EquipQR의 작업 지시 처리 과정', '작업 지시는 장비, 팀, 예방 정비 템플릿 및 재고를 하나의 과정으로 연결합니다.',
      ],
    },
    inventoryManagement: {
      content: [
        '작업 전에 필요한 부품을 확보하세요', '재고, 입고 및 출고를 추적하세요. 부품을 장비에 연결하면 기술자가 작업 지시에 맞는 품목을 선택할 수 있습니다.',
        '이용 방법', '부품을 입고하고 작업 지시에 출고한 뒤 재고가 줄면 재주문하세요.',
        '부품 재고', '품목별 재고량, 경고 기준 및 거래 이력을 확인하세요.',
        '첫 부품 추가', '무료 계정을 만들고 다음 작업부터 재고를 추적하세요.', '첫 부품 추가',
      ],
      capabilitiesTitle: '재고에서 추적할 수 있는 항목',
      capabilitiesDescription: '카탈로그, 거래, 호환성 및 재고 부족 알림을 한곳에서 관리하세요.',
      capabilities: [
        ['부품 카탈로그', '부품 번호, 설명 및 선호 공급업체가 포함된 중앙 부품·소모품 카탈로그를 관리하세요.'],
        ['거래 이력', '모든 입고, 출고 및 조정을 감사 이력에 남기세요. 누가 무엇을 언제 이동했는지 확인할 수 있습니다.'],
        ['호환성 규칙', '어떤 부품이 어떤 장비에 맞는지 정의하고 품목을 특정 제조사, 모델 또는 장비 유형에 연결하세요.'],
        ['재고 부족 알림', '최소 수량을 설정하고 재고가 기준 아래로 내려가면 알림을 받으세요. 다음 작업이 멈추기 전에 재주문하세요.'],
        ['장비 연결', '재고 품목을 장비와 연결해 작업 지시와 예방 정비 중 빠르게 찾으세요.'],
      ],
      benefits: [
        ['선반에 무엇이 있나요?', '입고, 출고 및 현재 수량', '여러 위치의 수량을 추적하고 모든 입고, 출고 및 조정을 기록하세요. 현재 재고를 한눈에 보거나 품목별 거래 이력을 확인할 수 있습니다.', '실시간 수량 갱신', '거래 감사 이력', '여러 위치 지원'],
        ['재고 부족 알림', '작업이 멈추기 전에 재주문', '품목별 최소 수량을 설정하고 재고가 기준 아래로 내려가면 알림을 받으세요. 부품 부족으로 장비가 멈추기 전에 재주문하세요.', '사용자 지정 기준', '앱 내 알림', '재주문 현황'],
        ['이 장비에는 어떤 부품이 맞나요?', '부품과 장비 연결', '호환성 규칙으로 장비에 맞는 부품을 정의하세요. 기술자는 작업 중인 장비와 관련된 품목만 보고 작업 지시에서 연결된 부품을 바로 사용할 수 있습니다.', '제조사·모델 규칙', '장비별 부품', '작업 지시 연동'],
      ],
      steps: [
        ['재고 품목 추가', '부품 번호, 설명, 선택적 최소·최대 수량을 입력하세요. 카테고리나 사용자 지정 필드로 카탈로그 구조에 맞게 정리할 수 있습니다.'],
        ['거래 기록', '재고가 들어오면 입고, 부품을 사용하면 출고, 실사나 수정 시에는 조정을 기록하세요. 모든 변경에 시각과 사용자가 남습니다.'],
        ['장비와 연결', '장비 유형에 맞는 부품이 표시되도록 호환성 규칙을 정의하세요. 작업 지시를 만들 때 부품 조회와 대체품을 사용해 재고에서 빠르게 찾을 수 있습니다.'],
        ['품절에 미리 대비', '재고 부족 알림을 활용해 소진 전에 재주문하세요. 대시보드와 보고서로 사용량 패턴을 분석하고 보충 계획을 세우세요.'],
      ],
      showcases: [
        ['부품, 재고량, SKU 및 재고 부족 표시를 보여주는 재고 목록', '재고 목록', '부품 번호, 설명, 현재 재고 및 재고 부족 표시와 함께 모든 품목을 확인하세요. 필터, 정렬 및 검색으로 필요한 품목을 빠르게 찾을 수 있습니다.'],
        ['재고 수량, 기준치, 단가 및 거래 이력 탭을 보여주는 품목 상세 화면', '품목 상세 및 재고 정보', '품목을 열어 보유 수량, 재고 부족 기준, 단가, 호환성 규칙 및 전체 거래 이력을 확인하세요. 한곳에서 재고를 조정하고 입고를 추가할 수 있습니다.'],
      ],
      seo: [
        '정비소 부품 재고 및 재고 부족 알림', '장비 호환성 규칙과 작업 지시에 연결된 감사 이력으로 부품, 입출고 및 재고 부족 알림을 관리하세요.',
        '재고', '정비소 부품 재고 및 재고 부족 알림', '재고량, 재고 부족 알림 및 호환성 규칙으로 부품과 소모품을 추적해 기술자가 작업마다 알맞은 품목을 선택하도록 하세요.',
        '재고를 장비 호환성과 연결할 수 있나요?', '네. 호환성 링크를 설정하면 기술자가 작업 지시에 사용 부품을 기록할 때 선호 부품이 표시됩니다.',
        '재고 부족 알림이 팀에 전달되나요?', 'EquipQR은 대시보드에서 재고 부족 기준을 강조해 구매 담당자가 작업 지연 전에 재주문할 수 있게 합니다.',
        '재고에 바코드 또는 QR을 사용할 수 있나요?', 'EquipQR은 장비와 재고 보관함 모두에 QR 라벨을 식별자로 사용해 입출고 시 스캔을 빠르게 합니다.',
        '재고 관리 방법', '재고는 입고, 출고 및 알림을 장비별 작업 과정과 연결합니다.',
      ],
    },
    partLookupAlternates: {
      content: [
        '선반에 있는 부품을 활용하세요', '부품 번호로 재고와 승인된 대체품을 확인하세요. 선호 SKU가 품절되면 대체품을 작업 지시에 추가할 수 있습니다.',
        '이용 방법', '번호를 검색하고 대체품을 비교해 지금 보유한 부품을 작업에 사용하세요.',
        '부품 조회', '부품 번호, OEM 번호 또는 설명으로 검색하고 재고, 대체품 및 가격을 확인하세요.',
        '첫 부품 번호 검색', '무료 계정을 만들고 다음 작업에 쓸 대체품을 재고에서 찾으세요.', '첫 부품 번호 검색',
      ],
      capabilitiesTitle: '부품 조회로 할 수 있는 일',
      capabilitiesDescription: '재고와 카탈로그에서 부품을 검색, 비교 및 대체하세요.',
      capabilities: [
        ['부품 번호 검색', '재고에서 부품 번호, 설명 또는 키워드로 검색하세요. 부분 번호만 알아도 빠른 유사 검색으로 찾을 수 있습니다.'],
        ['대체품 그룹', '서로 대체 가능한 부품을 그룹으로 지정하세요. 한 부품이 품절되면 승인된 대체품을 바로 확인할 수 있습니다.'],
        ['교차 참조', 'OEM, 애프터마켓 및 제조사 부품 번호를 연결하세요. 어떤 번호로든 관련 부품을 한곳에서 확인할 수 있습니다.'],
        ['재고 가용성', '부품과 대체품의 현재 재고량 및 위치를 확인하세요. 작업 지시에 바로 사용할 수 있는 품목을 알 수 있습니다.'],
        ['카탈로그 연동', '자체 재고와 외부 카탈로그 및 대체품 공급처를 함께 검색하세요. 주문 전에 가용성과 비용을 비교할 수 있습니다.'],
      ],
      benefits: [
        ['부품 번호 검색', '재고, 대체품 및 OEM 번호', '부품 번호, 설명 또는 제조사로 검색하세요. 재고, 대체품 그룹 및 연결된 교차 참조가 결과에 포함되어 맞는 부품을 놓치지 않습니다.', '빠른 검색 결과', '유사 검색', '카탈로그 간 조회'],
        ['재고에 있는 대체품 사용', '재고가 있는 승인 대체품', '서로 교환할 수 있는 부품 그룹을 만드세요. 선호 부품이 품절이면 승인된 대체품과 재고량을 확인하고 작업 지시에 사용할 수 있습니다.', '승인된 대체품만 표시', '빠른 대체', '작업 지연 감소'],
        ['재고 및 비용 비교', '근거를 바탕으로 선택', '부품과 대체품의 현재 재고 및 비용을 확인하세요. 작업 지시에 추가하거나 구매하기 전에 선택지를 비교할 수 있습니다.', '재고 확인', '비용 비교', '효율적인 주문'],
      ],
      steps: [
        ['부품 번호로 검색', '부품 조회에서 번호, 설명 또는 키워드를 입력하세요. 일치하는 재고 품목, 대체품 그룹 및 교차 참조를 확인하고 필요하면 가용성이나 장비 호환성으로 필터링하세요.'],
        ['대체품과 재고 확인', '부품을 열어 대체품 그룹과 재고량을 확인하세요. 선호 부품과 대체품의 가용성 및 비용을 비교한 뒤 재고를 사용하거나 재주문을 계획하세요.'],
        ['작업 지시에 사용', '작업 지시에 부품을 추가할 때 부품 조회에서 검색하거나 장비에 연결된 재고를 선택하세요. 기본 부품이 품절이면 대체품을 사용하세요. 사용량과 이력도 정확히 기록됩니다.'],
        ['대체품 그룹 관리', '앱에서 대체품 그룹을 만들고 관리하세요. 호환 부품을 추가하거나 제거하고 선호 부품을 지정해 교차 참조를 갱신하세요. 최신 정보가 검색에 반영됩니다.'],
      ],
      showcases: [
        ['부품 번호 검색 탭과 검색 제안이 있는 부품 조회 페이지', '부품 번호 또는 제조사·모델로 검색', 'OEM, 애프터마켓 또는 내부 부품 번호를 입력하면 일치하는 재고, 대체품 그룹 및 교차 참조를 함께 볼 수 있습니다. 제조사/모델 탭에서는 장비 유형별로 필터링하세요.'],
      ],
      seo: [
        '장비 정비소를 위한 부품 조회 및 대체품 그룹', 'OEM과 애프터마켓 부품을 검색하고 대체품을 비교하세요. 선호 부품이 품절되면 대체품을 작업 지시에 바로 추가할 수 있습니다.',
        '부품 조회', '장비 정비소를 위한 부품 조회 및 대체품 그룹', '부품을 빠르게 찾고 대체품을 비교해 선호 SKU가 없어도 작업을 계속하세요.',
        '부품 조회는 재고와 어떻게 연동되나요?', '검색 결과에 대체품 그룹과 함께 현재 재고량이 표시되어 담당자가 기술자에게 부품을 출고하기 전에 가용성을 확인할 수 있습니다.',
        '정비소에서 대체 관계를 관리할 수 있나요?', '네. 대체품 그룹으로 OEM과 애프터마켓 번호를 연결하고 선호 부품을 지정할 수 있습니다.',
        '일부 키워드만으로 검색할 수 있나요?', '기술자는 설명이나 번호 일부를 입력하고 장비 호환성 필터로 결과를 좁힐 수 있습니다.',
        '부품 조회 방법', '부품 조회와 대체품은 재고 및 작업 지시와 연결되어 찾은 부품을 작업에 바로 사용할 수 있습니다.',
      ],
    },
  } },
};
