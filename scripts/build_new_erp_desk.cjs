const fs = require('fs');

const src = fs.readFileSync('src/components/ErpDesk.tsx', 'utf8');
const lines = src.split('\n');

function getBlock(startLine, endLine) {
  return lines.slice(startLine - 1, endLine).join('\n');
}

// Top part: lines 1 to 6244
const topBlock = getBlock(1, 6244);

// Additional imports to inject at the top
const newImports = `
// Modular ERP Tabs
import OverviewTab from './erp/tabs/OverviewTab';
import FiscalCalendarTab from './erp/tabs/FiscalCalendarTab';
import CashBookPnlTab from './erp/tabs/CashBookPnlTab';
import VendorsTab from './erp/tabs/VendorsTab';
import VendorStatementTab from './erp/tabs/VendorStatementTab';
import PurchaseOrdersTab from './erp/tabs/PurchaseOrdersTab';
import LedgerTab from './erp/tabs/LedgerTab';
import HrTab from './erp/tabs/HrTab';
import ExpensesAssetsTab from './erp/tabs/ExpensesAssetsTab';
import ReportingTab from './erp/tabs/ReportingTab';

// Modular ERP Modals
import RegisterEditVendorModal from './erp/modals/RegisterEditVendorModal';
import PurchaseOrderModal from './erp/modals/PurchaseOrderModal';
import QuickAddMedicineModal from './erp/modals/QuickAddMedicineModal';
import BulkPoUploadModal from './erp/modals/BulkPoUploadModal';
import BulkGrnUploadModal from './erp/modals/BulkGrnUploadModal';
import UnmatchedCategoryDialog from './erp/modals/UnmatchedCategoryDialog';
import GrnModal from './erp/modals/GrnModal';
import TransactionModal from './erp/modals/TransactionModal';
import EmployeeModal from './erp/modals/EmployeeModal';
import PayrollModal from './erp/modals/PayrollModal';
import ExpenseModal from './erp/modals/ExpenseModal';
import AssetModal from './erp/modals/AssetModal';
import VendorPrintStatementModal from './erp/modals/VendorPrintStatementModal';
import PayVendorModal from './erp/modals/PayVendorModal';
import VendorPurchaseOrdersModal from './erp/modals/VendorPurchaseOrdersModal';
import PoPaymentHistoryModal from './erp/modals/PoPaymentHistoryModal';
import VendorPaymentHistoryStandaloneModal from './erp/modals/VendorPaymentHistoryStandaloneModal';
import WhatsAppPoModal from './erp/modals/WhatsAppPoModal';
`;

// Insert the new imports right after the other imports
const importInsertIdx = topBlock.indexOf('const WhatsAppIcon =');
const modifiedTopBlock = topBlock.slice(0, importInsertIdx) + newImports + '\n' + topBlock.slice(importInsertIdx);

const bottomRenderBlock = `
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <OverviewTab
            vendors={vendors}
            purchaseOrders={purchaseOrders}
            grns={grns}
            transactions={transactions}
            employees={employees}
            payrolls={payrolls}
            expenses={expenses}
            assets={assets}
            cashBookMetrics={cashBookMetrics}
            setActiveTab={setActiveTab}
            handleOpenAddVendor={handleOpenAddVendor}
            handleOpenNewPoModal={handleOpenNewPoModal}
            handleOpenGrnForPo={handleOpenGrnForPo}
            setShowTxnModal={setShowTxnModal}
            setShowExpenseModal={setShowExpenseModal}
            setShowEmpModal={setShowEmpModal}
            setShowPayrollModal={setShowPayrollModal}
            setShowAssetModal={setShowAssetModal}
          />
        )}

        {/* TAB 2: FISCAL CALENDAR DESK */}
        {activeTab === 'fiscal_calendar' && (
          <FiscalCalendarTab clinicSettings={clinicSettings} />
        )}

        {/* TAB 2: CASH BOOK & PNL REPORT */}
        {activeTab === 'cash_book_pnl' && (
          <CashBookPnlTab
            cashBookDateFilter={cashBookDateFilter}
            setCashBookDateFilter={setCashBookDateFilter}
            cashBookStartDate={cashBookStartDate}
            setCashBookStartDate={setCashBookStartDate}
            cashBookEndDate={cashBookEndDate}
            setCashBookEndDate={setCashBookEndDate}
            cashBookCategoryFilter={cashBookCategoryFilter}
            setCashBookCategoryFilter={setCashBookCategoryFilter}
            cashBookSearch={cashBookSearch}
            setCashBookSearch={setCashBookSearch}
            selectedFiscalYear={selectedFiscalYear}
            handleFiscalYearSelect={handleFiscalYearSelect}
            selectedFiscalMonth={selectedFiscalMonth}
            handleFiscalMonthSelect={handleFiscalMonthSelect}
            fiscalYearOptions={fiscalYearOptions}
            monthOptions={monthOptions}
            handleQuickPresetChange={handleQuickPresetChange}
            cashBookMetrics={cashBookMetrics}
            filteredCashBookEntries={filteredCashBookEntries}
            quickOutflowForm={quickOutflowForm}
            setQuickOutflowForm={setQuickOutflowForm}
            handleQuickOutflowSubmit={handleQuickOutflowSubmit}
            isSubmitting={isSubmitting}
            handlePrintCashBookReport={handlePrintCashBookReport}
            customExpenseCategories={customExpenseCategories}
          />
        )}

        {/* TAB 3: VENDORS DIRECTORY */}
        {activeTab === 'vendors' && (
          <VendorsTab
            vendors={vendors}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            handleOpenAddVendor={handleOpenAddVendor}
            handleOpenEditVendor={handleOpenEditVendor}
            handleDeleteVendor={handleDeleteVendor}
            handleOpenNewPoModal={handleOpenNewPoModal}
            handleOpenGrnForPo={handleOpenGrnForPo}
            setSelectedVendorId={setSelectedVendorId}
            setActiveTab={setActiveTab}
            setVendorPoModalData={setVendorPoModalData}
            setPoHistoryFilterPo={setPoHistoryFilterPo}
            setPoHistoryModalData={setPoHistoryModalData}
            setPayVendorModalData={setPayVendorModalData}
            handlePrintVendorStatement={handlePrintVendorStatement}
          />
        )}

        {/* TAB 2B: VENDOR ACCOUNT STATEMENT & PAYABLE LEDGER */}
        {activeTab === 'vendor_statement' && (
          <VendorStatementTab
            vendors={vendors}
            selectedVendorId={selectedVendorId}
            setSelectedVendorId={setSelectedVendorId}
            selectedVendor={selectedVendor}
            vendorDateFilter={vendorDateFilter}
            setVendorDateFilter={setVendorDateFilter}
            vendorStatement={vendorStatement}
            expandedGrnId={expandedGrnId}
            setExpandedGrnId={setExpandedGrnId}
            handleOpenEditVendorTop={handleOpenEditVendorTop}
            handleOpenNewPoModal={handleOpenNewPoModal}
            setPayVendorModalData={setPayVendorModalData}
            setVendorPoModalData={setVendorPoModalData}
            setPoHistoryFilterPo={setPoHistoryFilterPo}
            setPoHistoryModalData={setPoHistoryModalData}
            setShowPaymentHistoryModal={setShowPaymentHistoryModal}
            setVendorPrintModalOpen={setVendorPrintModalOpen}
            handlePrintVendorStatement={handlePrintVendorStatement}
          />
        )}

        {/* TAB 3: PURCHASE ORDERS */}
        {activeTab === 'po' && (
          <PurchaseOrdersTab
            purchaseOrders={purchaseOrders}
            filteredPurchaseOrders={filteredPurchaseOrders}
            totalPoFilteredAmount={totalPoFilteredAmount}
            poLogSearchTerm={poLogSearchTerm}
            setPoLogSearchTerm={setPoLogSearchTerm}
            poLogVendorFilter={poLogVendorFilter}
            setPoLogVendorFilter={setPoLogVendorFilter}
            poLogStatusFilter={poLogStatusFilter}
            setPoLogStatusFilter={setPoLogStatusFilter}
            poVendorList={poVendorList}
            handleOpenNewPoModal={handleOpenNewPoModal}
            setShowUploadBulkPoModal={setShowUploadBulkPoModal}
            isPoStockReceivedOrLocked={isPoStockReceivedOrLocked}
            handleOpenEditPoModal={handleOpenEditPoModal}
            handleDeletePo={handleDeletePo}
            handleOpenPoWhatsAppModal={handleOpenPoWhatsAppModal}
            handlePrintPo={handlePrintPo}
            handleOpenGrnForPo={handleOpenGrnForPo}
            setPayVendorModalData={setPayVendorModalData}
            setPoHistoryFilterPo={setPoHistoryFilterPo}
            setPoHistoryModalData={setPoHistoryModalData}
            vendors={vendors}
            grns={grns}
            filteredGrns={filteredGrns}
            totalGrnFilteredAmount={totalGrnFilteredAmount}
            grnLogSearchTerm={grnLogSearchTerm}
            setGrnLogSearchTerm={setGrnLogSearchTerm}
            grnLogVendorFilter={grnLogVendorFilter}
            setGrnLogVendorFilter={setGrnLogVendorFilter}
            grnVendorList={grnVendorList}
            setShowUploadBulkGrnModal={setShowUploadBulkGrnModal}
            setShowQrScannerModal={setShowQrScannerModal}
            setShowQrGeneratorModal={setShowQrGeneratorModal}
            handleOpenGrnPrintPreview={handleOpenGrnPrintPreview}
            handleDeleteGrn={handleDeleteGrn}
          />
        )}

        {/* TAB 4: FINANCIAL LEDGER & VOUCHERS */}
        {activeTab === 'ledger' && (
          <LedgerTab
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            ledgerSearchTerm={ledgerSearchTerm}
            setLedgerSearchTerm={setLedgerSearchTerm}
            ledgerDateMode={ledgerDateMode}
            setLedgerDateMode={setLedgerDateMode}
            cashBookDateFilter={cashBookDateFilter}
            cashBookStartDate={cashBookStartDate}
            cashBookEndDate={cashBookEndDate}
            setShowTxnModal={setShowTxnModal}
            handlePrintCashBookReport={handlePrintCashBookReport}
          />
        )}

        {/* TAB 5: HR & PAYROLL */}
        {activeTab === 'hr' && (
          <HrTab
            employees={employees}
            payrolls={payrolls}
            setShowEmpModal={setShowEmpModal}
            setShowPayrollModal={setShowPayrollModal}
            setEmpForm={setEmpForm}
            setPayrollForm={setPayrollForm}
          />
        )}

        {/* TAB 6: EXPENSES & ASSETS */}
        {activeTab === 'expenses_assets' && (
          <ExpensesAssetsTab
            expenses={expenses}
            assets={assets}
            setShowExpenseModal={setShowExpenseModal}
            setShowAssetModal={setShowAssetModal}
            setExpenseForm={setExpenseForm}
            setAssetForm={setAssetForm}
          />
        )}

        {/* TAB 7: REPORTING & ANALYTICS */}
        {activeTab === 'reporting' && (
          <ReportingTab clinicSettings={clinicSettings} />
        )}
      </div>

      {/* ========================================================================= */}
      {/* ERP MODALS (SPLIT INTO DEDICATED SUB-COMPONENTS) */}
      {/* ========================================================================= */}

      {/* 1. Register / Edit Vendor Modal */}
      <RegisterEditVendorModal
        showVendorModal={showVendorModal}
        setShowVendorModal={setShowVendorModal}
        editingVendor={editingVendor}
        setEditingVendor={setEditingVendor}
        vendorForm={vendorForm}
        setVendorForm={setVendorForm}
        handleSaveVendor={handleSaveVendor}
        isSubmitting={isSubmitting}
        vendors={vendors}
        handleOpenEditVendor={handleOpenEditVendor}
      />

      {/* 2. Create / Edit Purchase Order Modal */}
      <PurchaseOrderModal
        showPoModal={showPoModal}
        setShowPoModal={setShowPoModal}
        editingPurchaseOrder={editingPurchaseOrder}
        poForm={poForm}
        setPoForm={setPoForm}
        vendors={vendors}
        handleOpenAddVendor={handleOpenAddVendor}
        medicineSearchTerm={medicineSearchTerm}
        setMedicineSearchTerm={setMedicineSearchTerm}
        poCategoryFilter={poCategoryFilter}
        setPoCategoryFilter={setPoCategoryFilter}
        medicineFilterMode={medicineFilterMode}
        setMedicineFilterMode={setMedicineFilterMode}
        poGridPageSize={poGridPageSize}
        setPoGridPageSize={setPoGridPageSize}
        poGridPage={poGridPage}
        setPoGridPage={setPoGridPage}
        medicineCategories={medicineCategories}
        setShowUploadBulkPoModal={setShowUploadBulkPoModal}
        handleOpenQuickAddMedicineModal={handleOpenQuickAddMedicineModal}
        pagedMedicines={pagedMedicines}
        totalPoMedicinePages={totalPoMedicinePages}
        filteredCatalogMedicines={filteredCatalogMedicines}
        allCatalogMedicines={allCatalogMedicines}
        isMedicineSelectedInPo={isMedicineSelectedInPo}
        getMedicineItemCategory={getMedicineItemCategory}
        getMedicinePriceInfo={getMedicinePriceInfo}
        getRequiredQty={getRequiredQty}
        handleToggleMedicineInPo={handleToggleMedicineInPo}
        handlePoItemChange={handlePoItemChange}
        handleRemovePoItem={handleRemovePoItem}
        totalPoAmount={totalPoAmount}
        totalPoRequisitionQty={totalPoRequisitionQty}
        handleSavePurchaseOrder={handleSavePurchaseOrder}
        isSubmitting={isSubmitting}
      />

      {/* 3. Quick Add / Edit Medicine in PO */}
      <QuickAddMedicineModal
        showQuickAddMedModal={showQuickAddMedModal}
        setShowQuickAddMedModal={setShowQuickAddMedModal}
        quickAddMedForm={quickAddMedForm}
        setQuickAddMedForm={setQuickAddMedForm}
        isCustomCategory={isCustomCategory}
        setIsCustomCategory={setIsCustomCategory}
        customCategoryName={customCategoryName}
        setCustomCategoryName={setCustomCategoryName}
        medicineCategories={medicineCategories}
        handleSaveQuickMedicine={handleSaveQuickMedicine}
      />

      {/* 4. Upload Bulk PO */}
      <BulkPoUploadModal
        showUploadBulkPoModal={showUploadBulkPoModal}
        setShowUploadBulkPoModal={setShowUploadBulkPoModal}
        bulkPoPasteText={bulkPoPasteText}
        setBulkPoPasteText={setBulkPoPasteText}
        bulkPoError={bulkPoError}
        bulkPoParsedRows={bulkPoParsedRows}
        handleBulkPoPasteProcess={handleBulkPoPasteProcess}
        handleBulkPoFileUpload={handleBulkPoFileUpload}
        handleApplyBulkPoToCurrentPo={handleApplyBulkPoToCurrentPo}
        poForm={poForm}
        vendors={vendors}
      />

      {/* 5. Upload Bulk GRN Received Stock */}
      <BulkGrnUploadModal
        showUploadBulkGrnModal={showUploadBulkGrnModal}
        setShowUploadBulkGrnModal={setShowUploadBulkGrnModal}
        bulkGrnPasteText={bulkGrnPasteText}
        setBulkGrnPasteText={setBulkGrnPasteText}
        bulkGrnError={bulkGrnError}
        bulkGrnParsedRows={bulkGrnParsedRows}
        handleBulkGrnPasteProcess={handleBulkGrnPasteProcess}
        handleBulkGrnFileUpload={handleBulkGrnFileUpload}
        handleApplyBulkGrnToCurrentGrn={handleApplyBulkGrnToCurrentGrn}
        grnForm={grnForm}
        vendors={vendors}
      />

      {/* 6. Unmatched Categories Confirmation Dialog */}
      <UnmatchedCategoryDialog
        unmatchedCategoryDialog={unmatchedCategoryDialog}
        setUnmatchedCategoryDialog={setUnmatchedCategoryDialog}
        medicineCategories={medicineCategories}
        handleConfirmUnmatchedCategories={handleConfirmUnmatchedCategories}
      />

      {/* 7. Goods Received Note (GRN) Modal */}
      <GrnModal
        showGrnModal={showGrnModal}
        setShowGrnModal={setShowGrnModal}
        grnForm={grnForm}
        setGrnForm={setGrnForm}
        vendors={vendors}
        purchaseOrders={purchaseOrders}
        selectedPoForGrn={selectedPoForGrn}
        handleSaveGrn={handleSaveGrn}
        isSubmitting={isSubmitting}
        grnItemsState={grnItemsState}
        handleGrnItemChange={handleGrnItemChange}
        handleRemoveGrnItem={handleRemoveGrnItem}
        handleAddExtraGrnItem={handleAddExtraGrnItem}
        totalGrnAmount={totalGrnAmount}
        totalGrnItemsReceivedQty={totalGrnItemsReceivedQty}
        setShowUploadBulkGrnModal={setShowUploadBulkGrnModal}
        getMedicinePriceInfo={getMedicinePriceInfo}
        medicineMasterStock={medicineMasterStock}
      />

      {/* 8. Log Transaction Modal */}
      <TransactionModal
        showTxnModal={showTxnModal}
        setShowTxnModal={setShowTxnModal}
        txnForm={txnForm}
        setTxnForm={setTxnForm}
        vendors={vendors}
        handleSaveTransaction={handleSaveTransaction}
        isSubmitting={isSubmitting}
      />

      {/* 9. Employee Modal */}
      <EmployeeModal
        showEmpModal={showEmpModal}
        setShowEmpModal={setShowEmpModal}
        empForm={empForm}
        setEmpForm={setEmpForm}
        handleSaveEmployee={handleSaveEmployee}
        isSubmitting={isSubmitting}
      />

      {/* 10. Payroll Modal */}
      <PayrollModal
        showPayrollModal={showPayrollModal}
        setShowPayrollModal={setShowPayrollModal}
        payrollForm={payrollForm}
        setPayrollForm={setPayrollForm}
        employees={employees}
        handleSavePayroll={handleSavePayroll}
        isSubmitting={isSubmitting}
      />

      {/* 11. Expense Modal */}
      <ExpenseModal
        showExpenseModal={showExpenseModal}
        setShowExpenseModal={setShowExpenseModal}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        handleSaveExpense={handleSaveExpense}
        isSubmitting={isSubmitting}
        showAddCategoryInput={showAddCategoryInput}
        setShowAddCategoryInput={setShowAddCategoryInput}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleSaveNewCategory={handleSaveNewCategory}
        customExpenseCategories={customExpenseCategories}
        editingCategoryName={editingCategoryName}
        setEditingCategoryName={setEditingCategoryName}
        editCategoryNewValue={editCategoryNewValue}
        setEditCategoryNewValue={setEditCategoryNewValue}
        handleUpdateCustomCategory={handleUpdateCustomCategory}
        handleDeleteCustomCategory={handleDeleteCustomCategory}
        allExpenseCategories={allExpenseCategories}
        DEFAULT_EXPENSE_CATEGORIES={DEFAULT_EXPENSE_CATEGORIES}
      />

      {/* 12. Asset Modal */}
      <AssetModal
        showAssetModal={showAssetModal}
        setShowAssetModal={setShowAssetModal}
        assetForm={assetForm}
        setAssetForm={setAssetForm}
        handleSaveAsset={handleSaveAsset}
        isSubmitting={isSubmitting}
      />

      {/* 13. Printable Vendor Statement Preview Modal */}
      <VendorPrintStatementModal
        vendorPrintModalOpen={vendorPrintModalOpen}
        setVendorPrintModalOpen={setVendorPrintModalOpen}
        selectedVendor={selectedVendor}
        vendorStatement={vendorStatement}
        clinicSettings={clinicSettings}
        handlePrintVendorStatement={handlePrintVendorStatement}
      />

      {/* 14. Pay Vendor Bill Popup Modal */}
      <PayVendorModal
        payVendorModalData={payVendorModalData}
        setPayVendorModalData={setPayVendorModalData}
        purchaseOrders={purchaseOrders}
        grns={grns}
        transactions={transactions}
        setPoHistoryFilterPo={setPoHistoryFilterPo}
        setPoHistoryModalData={setPoHistoryModalData}
        handlePrintVendorStatement={handlePrintVendorStatement}
        handleSavePayVendorBill={handleSavePayVendorBill}
        isSubmitting={isSubmitting}
      />

      {/* 15. Vendor Purchase Orders Modal */}
      <VendorPurchaseOrdersModal
        vendorPoModalData={vendorPoModalData}
        setVendorPoModalData={setVendorPoModalData}
        purchaseOrders={purchaseOrders}
        grns={grns}
        transactions={transactions}
        handleOpenNewPoModal={handleOpenNewPoModal}
        handleOpenEditPoModal={handleOpenEditPoModal}
        handlePrintPo={handlePrintPo}
        setPayVendorModalData={setPayVendorModalData}
        setPoHistoryFilterPo={setPoHistoryFilterPo}
        setPoHistoryModalData={setPoHistoryModalData}
        isPoStockReceivedOrLocked={isPoStockReceivedOrLocked}
      />

      {/* 16. Payment History for PO Modal */}
      <PoPaymentHistoryModal
        poHistoryModalData={poHistoryModalData}
        setPoHistoryModalData={setPoHistoryModalData}
        poHistoryFilterPo={poHistoryFilterPo}
        setPoHistoryFilterPo={setPoHistoryFilterPo}
        purchaseOrders={purchaseOrders}
        grns={grns}
        transactions={transactions}
        handlePrintVendorStatement={handlePrintVendorStatement}
        setPayVendorModalData={setPayVendorModalData}
        handlePrintSinglePaymentVoucher={handlePrintSinglePaymentVoucher}
      />

      {/* 17. Vendor Payment History Standalone Modal */}
      <VendorPaymentHistoryStandaloneModal
        showPaymentHistoryModal={showPaymentHistoryModal}
        setShowPaymentHistoryModal={setShowPaymentHistoryModal}
        paymentHistoryVendorFilter={paymentHistoryVendorFilter}
        setPaymentHistoryVendorFilter={setPaymentHistoryVendorFilter}
        vendors={vendors}
        transactions={transactions}
        setPayVendorModalData={setPayVendorModalData}
        handlePrintSinglePaymentVoucher={handlePrintSinglePaymentVoucher}
      />

      {/* QR Code Scanner & Generator Modals */}
      <ItemQRScannerModal
        isOpen={showQrScannerModal}
        onClose={() => setShowQrScannerModal(false)}
        onScanSuccess={(parsed) => {
          setMedicineSearchTerm(parsed.itemId || parsed.itemName);
          setShowQrScannerModal(false);
        }}
      />

      <ItemQRGeneratorModal
        isOpen={showQrGeneratorModal}
        onClose={() => setShowQrGeneratorModal(false)}
        items={inventoryItems.map((itm: any) => ({
          ItemID: itm.ItemID || \`ITM-\${Math.floor(100 + Math.random() * 900)}\`,
          ItemName: itm.ItemName || 'Medicine Item',
          MedicineType: itm.MedicineType || 'P',
          Category: itm.Category || 'General',
          Price: itm.Price || itm.PurchasePrice || 100,
          CStock: itm.CStock ?? itm.Stock ?? 0,
          Unit: itm.Unit || 'Pack'
        }))}
        clinicName="ERP Pharmacy Operations"
      />

      {/* Dedicated GRN Print Preview Modal */}
      <GrnPrintPreviewModal
        isOpen={showGrnPrintPreviewModal}
        onClose={() => {
          setShowGrnPrintPreviewModal(false);
          setGrnPrintPreviewData(null);
        }}
        grn={grnPrintPreviewData}
        clinicSettings={clinicSettings}
        currentUser={currentUser}
      />

      {/* WhatsApp Purchase Order Modal */}
      <WhatsAppPoModal
        showWhatsAppPoModal={showWhatsAppPoModal}
        setShowWhatsAppPoModal={setShowWhatsAppPoModal}
        selectedPoForWhatsApp={selectedPoForWhatsApp}
        whatsAppVendorPhone={whatsAppVendorPhone}
        setWhatsAppVendorPhone={setWhatsAppVendorPhone}
        whatsAppCustomPoNotes={whatsAppCustomPoNotes}
        setWhatsAppCustomPoNotes={setWhatsAppCustomPoNotes}
        whatsAppIncludePrices={whatsAppIncludePrices}
        setWhatsAppIncludePrices={setWhatsAppIncludePrices}
        whatsAppPoTextPreview={whatsAppPoTextPreview}
        handleSendPoWhatsApp={handleSendPoWhatsApp}
      />
    </div>
  );
}
`;

const finalErpDesk = modifiedTopBlock + '\n' + bottomRenderBlock;
fs.writeFileSync('src/components/ErpDesk.tsx', finalErpDesk, 'utf8');
console.log('ErpDesk.tsx rebuilt successfully!');
