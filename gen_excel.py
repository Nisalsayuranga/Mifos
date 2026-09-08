import xlsxwriter

def create_ledger_excel(filename):
    workbook = xlsxwriter.Workbook(filename)
    
    # Formats
    header_format = workbook.add_format({
        'bold': True, 'bg_color': '#D3D3D3', 'border': 1, 'align': 'center', 'valign': 'vcenter'
    })
    sub_header_format = workbook.add_format({
        'bold': True, 'bg_color': '#EFEFEF', 'border': 1, 'align': 'center', 'valign': 'vcenter'
    })
    cell_format = workbook.add_format({'border': 1, 'align': 'center'})
    currency_format = workbook.add_format({'border': 1, 'align': 'right', 'num_format': '#,##0.00'})
    title_format = workbook.add_format({'bold': True, 'font_size': 14})
    summary_label_format = workbook.add_format({'bold': True, 'border': 1})
    summary_value_format = workbook.add_format({'border': 1, 'align': 'right', 'num_format': '#,##0.00'})
    summary_formula_format = workbook.add_format({'bold': True, 'border': 1, 'align': 'right', 'num_format': '#,##0.00', 'bg_color': '#E2EFDA'})
    
    # Dropdown lists
    type_list = ['I', 'R']
    fs_list = ['F', 'S']
    transfer_list = ['B2B', 'B2O', 'O2B']
    prefix_list = ['1R', '12R', '3R', '6R', 'M', 'A']
    
    sheet_names = ['Template'] + [str(i) for i in range(1, 32)]
    
    for sheet_name in sheet_names:
        worksheet = workbook.add_worksheet(sheet_name)
        
        # Set column widths
        worksheet.set_column('A:A', 8)  # LOAN CODE
        worksheet.set_column('B:B', 10) # LOAN NUMBER
        worksheet.set_column('C:C', 15) # CASH (LOAN)
        worksheet.set_column('D:D', 12) # INSURANCE
        worksheet.set_column('E:E', 8)  # WT.G
        worksheet.set_column('F:F', 8)  # WT.MG
        worksheet.set_column('G:G', 10) # ITEM CODE
        worksheet.set_column('H:H', 8)  # REDEEM CODE
        worksheet.set_column('I:I', 10) # REDEEM NUMBER
        worksheet.set_column('J:J', 15) # INTEREST
        worksheet.set_column('K:K', 15) # CASH (RDM)
        worksheet.set_column('L:L', 8)  # TYPE
        worksheet.set_column('M:M', 8)  # F/S
        
        # Header Section
        worksheet.write('A1', 'Date:', summary_label_format)
        worksheet.merge_range('B1:C1', '', cell_format)
        worksheet.write('E1', 'Branch:', summary_label_format)
        worksheet.merge_range('F1:G1', '', cell_format)
        worksheet.write('I1', 'CP Balance:', summary_label_format)
        worksheet.merge_range('J1:K1', '', currency_format)
        worksheet.write('L1', 'Staff:', summary_label_format)
        worksheet.write('M1', '', cell_format)
        
        # Transactions Grid Title
        worksheet.write('A3', 'Daily Transactions Grid', title_format)
        
        # Main Headers (Row 4)
        worksheet.merge_range('A5:B5', 'LOAN NO', header_format)
        worksheet.merge_range('C5:C6', 'CASH (LOAN)', header_format)
        worksheet.merge_range('D5:D6', 'INSURANCE', header_format)
        worksheet.merge_range('E5:E6', 'WT.G', header_format)
        worksheet.merge_range('F5:F6', 'WT.MG', header_format)
        worksheet.merge_range('G5:G6', 'ITEM CODE', header_format)
        worksheet.merge_range('H5:I5', 'REDEEM NO', header_format)
        worksheet.merge_range('J5:J6', 'INTEREST', header_format)
        worksheet.merge_range('K5:K6', 'CASH (RDM)', header_format)
        worksheet.merge_range('L5:L6', 'TYPE', header_format)
        worksheet.merge_range('M5:M6', 'F/S', header_format)
        
        # Sub Headers (Row 5)
        worksheet.write('A6', 'CODE', sub_header_format)
        worksheet.write('B6', 'NUMBER', sub_header_format)
        worksheet.write('H6', 'CODE', sub_header_format)
        worksheet.write('I6', 'NUMBER', sub_header_format)
            
        # Grid Rows (7 to 36 in excel)
        for row in range(6, 36):
            for col in range(13):
                if col in [2, 3, 9, 10]: # Currency columns
                    worksheet.write(row, col, '', currency_format)
                else:
                    worksheet.write(row, col, '', cell_format)
            
            # Data validation
            worksheet.data_validation(row, 0, row, 0, {'validate': 'list', 'source': prefix_list}) # LOAN CODE
            worksheet.data_validation(row, 7, row, 7, {'validate': 'list', 'source': prefix_list}) # RDM CODE
            worksheet.data_validation(row, 11, row, 11, {'validate': 'list', 'source': type_list}) # TYPE
            worksheet.data_validation(row, 12, row, 12, {'validate': 'list', 'source': fs_list}) # F/S
            
        # Grid Totals Row (Excel 37)
        worksheet.merge_range('A37:B37', 'TOTALS:', header_format)
        worksheet.write_formula('C37', '=SUM(C7:C36)', header_format)
        worksheet.write_formula('D37', '=SUM(D7:D36)', header_format)
        for col in range(4, 9):
            worksheet.write(36, col, '', header_format)
        worksheet.write_formula('J37', '=SUM(J7:J36)', header_format)
        worksheet.write_formula('K37', '=SUM(K7:K36)', header_format)
        worksheet.write(36, 11, '', header_format)
        worksheet.write(36, 12, '', header_format)
        
        # Cash Summary Title
        worksheet.write('A39', 'Daily Cash Summary', title_format)
        
        # Cash Summary Rows
        summary_items = [
            ('1. O/Balance:', ''),
            ('2. Cash In / Transfer In (+):', ''),
            ('3. Cash Out / Transfer Out (-):', ''),
            ('4. Loan (-):', '=C37'),
            ('5. Redeem (+):', '=K37'),
            ('6. Receive (+):', ''),
            ('7. Recovery (+):', ''),
            ('8. Insurance (+):', '=D37'),
            ('9. Expenses (-):', ''),
            ('10. L/Balance (Formula Sum):', '=B40+B41-B42-B43+B44+B45+B46+B47-B48'),
            ('11. Actual Cash Count:', ''),
            ('12. Variance:', '=B50-B49')
        ]
        
        row_num = 39
        for i, (label, formula) in enumerate(summary_items):
            worksheet.merge_range(row_num, 0, row_num, 1, label, summary_label_format)
            if formula:
                worksheet.write_formula(row_num, 2, formula, summary_formula_format)
            else:
                worksheet.write(row_num, 2, '', summary_value_format)
            
            # Data validation for transfer types
            if 'Transfer In' in label:
                worksheet.data_validation(row_num, 3, row_num, 3, {'validate': 'list', 'source': transfer_list})
                worksheet.write(row_num, 3, 'Select Type', cell_format)
            elif 'Transfer Out' in label:
                worksheet.data_validation(row_num, 3, row_num, 3, {'validate': 'list', 'source': transfer_list})
                worksheet.write(row_num, 3, 'Select Type', cell_format)
                
            row_num += 1

    workbook.close()

if __name__ == '__main__':
    create_ledger_excel('Daily_Ledger_System.xlsx')
    print('Excel file created successfully!')
