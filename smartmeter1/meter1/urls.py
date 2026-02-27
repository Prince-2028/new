from django.urls import path
from .views import *



urlpatterns = [
    

       # STEP 1: Generate user code (CLIENT PC)
    path('api/step1-generate-code/', GenerateUserCodeView.as_view(), name='step1_generate_code'),
    
    # STEP 2: Generate serial (MANUFACTURER)
    path('api/step2-generate-serial/', GenerateSerialView.as_view(), name='step2_generate_serial'),
    
    # STEP 3: Verify serial (CLIENT PC)
    path('api/step3-verify-serial/', VerifySerialView.as_view(), name='step3_verify_serial'),
    
    # Check status
    path('api/check-status/', CheckStatusView.as_view(), name='check_status'),
  
  
    path('create_user/', CreateUser.as_view(), name='create_user'),
    path('roles/', RoleListAPIView.as_view(), name='role-list'), 
    path('login/', LoginUser.as_view(), name='login'),
    path('add_user/',AddUser.as_view(),name="add_user"),
    
    path('get_users/', GetUsers.as_view(),name="get_users"),
    path('delete_user/', DeleteUser.as_view(), name='delete_user'),
    path('media_data/', CreateData.as_view(), name='create_data'),
    path('media_data/active/<str:serial>/',GetActiveMedia.as_view(),name='get_active_media_by_serial'),
    path('meter-types/', MeterTypeChoicesAPIView.as_view(), name='meter-types'),
    path('serial-ports/', SerialPortListView.as_view(), name='serial-port-list'),
    path('stream_obis/', StreamObisView.as_view(), name='stream_obis'),

    path('add-device/', AddDeviceAPIView.as_view(), name='add-device'),
    path('get-user-devices/', GetUserDevicesAPIView.as_view(), name='get-user-devices'),
    path('delete-device/', DeleteDeviceAPIView.as_view(), name='delete-device'),
    path('edit-device/', EditDeviceAPIView.as_view(), name='edit-device'),
    path('copy-device/', CopyDeviceAPIView.as_view(), name='copy-device'),

    path('api/meter/create/', CreateMeterAPIView.as_view(), name='create-meter'),
    path('api/getmeterinfo/', MeterDetailAPIView.as_view(), name='get_meter_info'),

    path('threshold/create/', CreateThresholdAPIView.as_view(), name='create-threshold'),
    path('thresholds/<str:serial_number>/', ListThresholdAPIView.as_view(), name='list-thresholds'),

    # TimeSettings URLs - multiple patterns for compatibility
    path('api/TimeSettingsAPIView/', TimeSettingsAPIView.as_view(), name='TimeSettingsAPIView'),  # Main endpoint for frontend

    path('api/tariff-parameters/', TariffParameterAPIView.as_view(), name='tariff-parameters-create-update'),
    path('api/tariff-parameters/<int:device_id>/', GetTariffParameterAPIView.as_view(), name='tariff-parameters-get'),


    path('api/tariff-specialdays/', SpecialDayAPIView.as_view(), name='special-day-create'),  # For POST request to add special days
    path('api/tariff-specialdays/<int:device_id>/', SpecialDayListAPIView.as_view(), name='special-day-list'),  # For GET request to retrieve special days
    
    path('api/tariff-specialdays/<int:device_id>/<int:special_day_id>/', SpecialDayDetailAPIView.as_view(), name='delete_special_day'),  # For DELETE request
    path('api/tariff-specialdays/<int:device_id>/clear/', SpecialDayDetailAPIView.as_view(), name='clear_special_days'),



    path('api/tariff/threshold-actions/',TariffThresholdActionAPIView.as_view(),name="tariff-threshold-actions-create"),
    path('api/tariff-threshold-action/<int:device_id>/', TariffThresholdActionAPIView.as_view(), name='tariff-threshold-get'),
    path('api/tariff-threshold-action/<int:device_id>/<str:type>/<int:id>/', TariffThresholdActionAPIView.as_view(), name='delete_threshold_action'),

    path('api/tou-calendar/',CreateTOUCalendarAPIView.as_view(),name='Create_tou_calendar'),
    path('api/tou-calendar/<int:device_id>/<str:entity_type>/<str:status_type>/', CreateTOUCalendarAPIView.as_view(), name='get_tou_calendar'),
    path('api/tou-calendars/<int:calendar_id>/',CreateTOUCalendarAPIView.as_view(),name='delete_tou_calendar' ),
    path('api/tou-calendar/update/<int:calendar_id>/', CreateTOUCalendarAPIView.as_view(), name='update-tou-calendar'),



    path('api/add-register-limiter/',RegisterLimiterAPIView.as_view(),name='Create_register_limiter'),
    path('api/get-register-limiter/<int:device_id>/<str:monitor_type>/', RegisterLimiterAPIView.as_view(), name='get_register_limiter_data'),
    path('api/delete-register-limiter/<int:id>/', RegisterLimiterAPIView.as_view(), name='delete_register_limiter'),

    path('api/add-security-settings/',  SecuritySettingsView.as_view(), name='security-settings'),
   
    path('api/add-push-setup-item/', PushSetupItemView.as_view(), name='add_push-setup-item'),
    path('api/get-push-setup-item/<int:device_id>/', PushSetupItemView.as_view(), name='get_push_setup_item'),  # For both GET and POST requests
    path('api/delete-setup-items/<int:id>/', PushSetupItemView.as_view(), name='push_setup_item_delete'),



    path('api/add-other-parameters/', OtherParametersView.as_view(), name='add-other-parameters'),

    path('api/create-scheduler/', CreateSchedulerView.as_view(), name='create_scheduler'),
    path('api/get-scheduler/<int:device_id>/<str:scheduler_type>/', CreateSchedulerView.as_view(), name='get_scheduler'),
    path('api/delete-scheduler/<int:scheduler_id>/', CreateSchedulerView.as_view(), name='delete_scheduler'),

    path('api/create_auto_connect_settings/', CreateAutoConnectSettingsView.as_view(), name='create_auto_connect_settings'),
    path('api/get_auto_connect_settings/<int:device_id>/<str:type>/',CreateAutoConnectSettingsView.as_view(),name='get_auto_connect_settings'),
    path('api/delete_auto_connect_settings/<int:id>/', CreateAutoConnectSettingsView.as_view(), name='delete_auto_connect_settings'),

    path('api/create-auto-answer-settings/', AutoAnswerSettingsCreateView.as_view(), name='auto-answer-settings-create'),
    path('api/get-auto-answer-settings/<int:device_id>/', AutoAnswerSettingsCreateView.as_view(), name='auto_answer_settings_list'),
    path('api/delete-auto-answer-settings/<int:auto_answer_settings_id>/', AutoAnswerSettingsCreateView.as_view(), name='delete_auto_answer_settings'),

    path('api/create_ipv4_setup/', IPv4SetupCreateView.as_view(), name='create_ipv4_setup'),
    path('api/get_ipv4_setup/<int:device_id>/', IPv4SetupCreateView.as_view(), name='ipv4-setup-detail'),
    
    path('api/create_update_tcpudpsetup/', CreateOrUpdateTcpUdpSetup.as_view(), name='create_or_update_tcp_udp_setup'),
    path('api/get_tcpudpsetup/<int:device_id>/',CreateOrUpdateTcpUdpSetup.as_view(),name='get_tcp_udp_setup'),
    
    path('api/get_modules/<int:device_id>/', ModuleInformationView.as_view(), name='module-information-get'),  # GET for device_id
    path('api/create_modules/', ModuleInformationView.as_view(), name='module-information-post'),  # POST for creating/updating

    path('api/create-ppp-setup/', PPPSetupView.as_view(), name='create-ppp-setup'),
    path('api/get-ppp-setup/<int:device_id>/<str:type>/', PPPSetupView.as_view(), name='create-ppp-setup'),

    path('api/create-gprs-setup/', GprsSetupView.as_view(), name='gprs-setup'),

    path('api/create-update-energy-register/', EnergyRegisterView.as_view(), name='energy-register'),
    path('api/retrive-energy-register/', EnergyRegisterViewRetrive.as_view(), name='energy-register'),
    
    path('api/create-state-of-internal-control/', StateOfInternalControlView.as_view(), name='state_of_internal_control'),
    path('api/create-internal-operating-status/',InternalOperatingStatusView.as_view(),name='Internal_operating_statusView'),

    path('api/create-power-quality-status/', PowerQualityStatusView.as_view(), name='power_quality_status'),

    path('api/create-tamper-indicate-status/', TamperIndicateStatusView.as_view(), name='tamper_indicate_status'),

    path('api/create-error-register1/', ErrorRegister1View.as_view(), name='create_error_register1'),
    path('api/get-error-register1/<int:device_id>/', ErrorRegister1View.as_view(), name='get_error_register1'),

    path('api/create-error-register2/', ErrorRegister2View.as_view(), name='create_error_register2'),
    path('api/get-error-register2/<int:device_id>/', ErrorRegister2View.as_view(), name='get_error_register2'),

    path('api/create-alarm-register1/', AlarmRegister1View.as_view(), name='create_alarm_register1'),
    path('api/get-alarm-register1/<int:device_id>/', AlarmRegister1View.as_view(), name='get_error_register1'),

    path('api/create-alarm-register2/', AlarmRegister2View.as_view(), name='create_alarm_register1'),
    path('api/get-alarm-register2/<int:device_id>/', AlarmRegister2View.as_view(), name='get_error_register1'),

    path('api/create-alarm-filter1/', AlarmFilter1View.as_view(), name='create_alarm_register1'),
    path('api/get-alarm-filter1/<int:device_id>/', AlarmFilter1View.as_view(), name='get_error_register1'),

    path('api/create-alarm-filter2/', AlarmFilter2View.as_view(), name='create_alarm_register1'),
    path('api/get-alarm-filter2/<int:device_id>/', AlarmFilter2View.as_view(), name='get_error_register1'),

    path('api/create-alarm-descriptor1/', AlarmDescriptor1View.as_view(), name='create_alarm_register1'),
    path('api/get-alarm-descriptor1/', AlarmDescriptor1View.as_view(), name='create_alarm_register1'),

    path('api/create-alarm-descriptor2/', AlarmDescriptor2View.as_view(), name='create_alarm_register1'),
    path('api/get-alarm-descriptor2/', AlarmDescriptor2View.as_view(), name='create_alarm_register1'),

    path('api/event-report-filter/',EventReportFilterView.as_view(),name='event_report_filterview'),
    path('api/get-event-report-filter/<int:device_id>/<str:filter_type>/',EventReportFilterView.as_view(),name='event_report_filterview'),

    path('api/demand-configure/', DemandConfigureView.as_view(), name='demand-configure'),
    path('api/demand-configure/<int:device_id>/', DemandConfigureView.as_view(), name='get-demand-configure'),

    path('api/add-payments/', PaymentCreateView.as_view(), name='add-payments'),

    path('api/payment-details/', PaymentDetailView.as_view(), name='payment-details'),  # For POST
    path('api/payment-details/<int:device_id>/', PaymentDetailView.as_view(), name='get-payment-details'),  # For GET

    path('api/active-energy-register/', ActiveEnergyRegisterView.as_view(),name='active_energy_registerView'),
    path('api/active-energy-register/<int:device_id>/<str:billing_period>/', ActiveEnergyRegisterView.as_view(),name='active_energy_registerView'),

    path('api/reactive-energy-register/', ReactiveEnergyRegisterView.as_view(), name='reactive_energy_register_post'),
    path('api/reactive-energy-register/<int:device_id>/<str:billing_period>/', ReactiveEnergyRegisterView.as_view(), name='reactive_energy_register_get_filtered'),

    path('api/apparent-energy-registers/', ApparentEnergyRegisterView.as_view(), name='apparent_energy_registers'),
    path('api/apparent-energy-registers/<int:device_id>/<str:billing_period>/', ApparentEnergyRegisterView.as_view(), name='apparent_energy_registers_device_period'),

    path('api/active-maximum-demand-registers/', ActiveMaximumDemandRegisterView.as_view(), name='active-maximum-demand-register-list'),
    path('api/active-maximum-demand-registers/<int:device_id>/', ActiveMaximumDemandRegisterView.as_view(), name='active-maximum-demand-register-device'),

    path('api/reactive-maximum-demand-registers/', ReactiveMaximumDemandRegisterView.as_view(), name='active-maximum-demand-register-list'),
    path('api/reactive-maximum-demand-registers/<int:device_id>/', ReactiveMaximumDemandRegisterView.as_view(), name='active-maximum-demand-register-device'),

    path('api/apparent-maximum-demand-registers/',ApparentMaximumDemandRegisterView.as_view(),name='apparent-maximum-demand-registerView'),
    path('api/apparent-maximum-demand-registers/<int:device_id>/',ApparentMaximumDemandRegisterView.as_view(),name='apparent-maximum-demand-registerView'),

    path('api/daily-payments/', DailyPaymentView.as_view(), name='daily-payments-list'),  # For POST
    path('api/daily-payments/<int:device_id>/', DailyPaymentView.as_view(), name='daily-payments-detail'),  # For GET\
    
    path('api/account-details-status/', AccountDetailsStatusView.as_view(), name='account_details_status'),
    path('api/account-details-status/<int:device_id>/', AccountDetailsStatusView.as_view(), name='account_details_status_device'),
      # POST method: Create account details statuses
    path('api/account-details-values/', AccountDetailsValueView.as_view(), name='create_account_details_status'),
    path('api/account-details-values/<int:device_id>/', AccountDetailsValueView.as_view(), name='get_account_details_status'),
    path('api/credit-reference/', CreditReferenceView.as_view(), name='credit_reference_add'),
    path('api/credit-reference/<int:device_id>/', CreditReferenceView.as_view(), name='get-credit_reference'),
    path('api/credit-charge-config/', CreditChargeConfigView.as_view(), name='create_credit_charge_config'),
    path('api/credit-charge-config/<int:device_id>/', CreditChargeConfigView.as_view(), name='get_credit_charge_config'),
    path('api/token-gateway-config/', TokenGatewayConfigView.as_view(), name='token_gateway_config_create'),
    path('api/token-gateway-config/<int:device_id>/', TokenGatewayConfigView.as_view(), name='token_gateway_config_list'),
    path('api/token-credit/', TokenCreditView.as_view(), name="token-credit-create"),  # POST for multiple token credits
    path('api/token-credit/<int:device_id>/', TokenCreditView.as_view(), name="token-credit-get"),  # GET token credits by device_id
    path('api/token-credit/<str:action>/', TokenCreditView.as_view(), name="token-credit-action"),  # POST with action (update/set/invoke)
    path('api/emergency-credit/', EmergencyCreditView.as_view(), name='emergency_credit_create'),  # POST to create new emergency credit
    path('api/emergency-credit/<int:device_id>/', EmergencyCreditView.as_view(), name='emergency_credit_list'),  # GET to get emergency credit details by device_id
    path('api/emergency-credit/<str:action>/', EmergencyCreditView.as_view(), name='emergency_credit_action'),  # PUT for update/set/invoke actions
    
    path('api/payment-charge-value/', PaymentChargeValueDataView.as_view(), name='payment-charge-value-list'),  # POST method (bulk create)
    path('api/payment-charge-value/<int:device_id>/', PaymentChargeValueDataView.as_view(), name='payment-charge-value-detail'),  # GET method (fetch by device_id)

    path('api/unit-charges/', BulkUnitChargeCreateAPIView.as_view(), name='bulk-unit-charge-create'),

   
    path('api/unit-charges/<int:device_id>/<str:unit_type>/', BulkUnitChargeCreateAPIView.as_view(), name='unit-charge-list'),
    path("api/payment-token/", TokenGatewayView.as_view(), name="token_gateway"),
    path("api/payment-token/<int:device_id>/", TokenGatewayView.as_view(), name="token_gateway"),
    path('api/payment-information/', PaymentInformationView.as_view(), name='payment_information_post'),
    path('api/payment-information/<int:device_id>/', PaymentInformationView.as_view(), name='payment_information_get'),
   
    path('api/friendly-periods/', FriendlyPeriodAPI.as_view(), name="friendly_periods"),
    path('api/friendly-periods/<int:device_id>/', FriendlyPeriodAPI.as_view(), name="friendly_periods_by_device"),
    path('api/friendly-weekdays/<int:device_id>/',FriendlyWeekdayView.as_view(), name="friendly_weekday"),
    path('api/friendly-weekdays/', FriendlyWeekdayView.as_view(), name="friendly_weekday"),  # POST method
   
    path('api/friendlyholiday/<int:device_id>/', FriendlyHolidayView.as_view(), name='friendly_holiday_get'),
    path('api/friendlyholiday/', FriendlyHolidayView.as_view(), name='friendly_holiday_post'),
    path('api/friendlyholiday/delete/<int:holiday_id>/', FriendlyHolidayView.as_view(), name='friendly_holiday_delete'),
    path('api/friendlyholiday/clear/<int:device_id>/', ClearFriendlyHolidayView.as_view(), name='clear_friendly_holiday'),
    path('api/alarmcredit/', AlarmOfCreditView.as_view(), name='alarm-create'),
    path('api/alarmcredit/<int:device_id>/', AlarmOfCreditView.as_view(), name='alarm-list'),
 
    path('api/step-price/<int:device_id>/', StepPriceAPIView.as_view(), name='step-price-get'),
    path('api/step-price/', StepPriceAPIView.as_view(), name='step-price-post'),
    path('api/step-price/delete/<int:step_id>/', StepPriceAPIView.as_view(), name='step-price-delete'),
    path('api/step-price/update/<int:step_id>/', StepPriceAPIView.as_view(), name='step-price-update'),

    path('api/scroll-display/', ScrollDisplayView.as_view(), name='scroll-display-list'),
    path('api/scroll-display/<int:device_id>/', ScrollDisplayView.as_view(), name='scroll-display-get'),
    path('api/manual-display/', ManualDisplayView.as_view(), name='manual-display-list-create'),
    path('api/manual-display/<int:device_id>/', ManualDisplayView.as_view(), name='manual-display-detail'),
    path('api/lcd-display-format/', LcdDisplayFormatView.as_view(), name='create-update-lcd-display-format'),
    path('api/lcd-display-format/<int:device_id>/', LcdDisplayFormatView.as_view(), name='get-lcd-display-format'),
    path('api/display-parameters/', DisplayParameterListCreateUpdateView.as_view(), name='display-parameter-list-create-update'),
    path('api/display-parameters/<int:device_id>/', DisplayParameterListCreateUpdateView.as_view(), name='display-parameter-get-by-device'),
    path('api/load-control-settings/', LoadControlSettingsListCreateUpdateView.as_view(), name='load_control_settings_post'),
    path('api/load-control-settings/<int:device_id>/', LoadControlSettingsListCreateUpdateView.as_view(), name='load_control_settings_get'),
    path('api/disconnect-control/', DisconnectControlListCreateUpdateView.as_view(), name='disconnect-control-create-update'),
    path('api/disconnect-control/<int:device_id>/', DisconnectControlListCreateUpdateView.as_view(), name='disconnect-control-get'),
    path('api/load-control-related/', LoadControlListCreateUpdateView.as_view(), name='load-control-create-update'),
    path('api/load-control-related/<int:device_id>/', LoadControlListCreateUpdateView.as_view(), name='load-control-get'),
    path('api/relay1-status/', Relay1StatusListCreateUpdateView.as_view(), name='relay1-status-post'),  # POST method
    path('api/relay1-status/<int:device_id>/', Relay1StatusListCreateUpdateView.as_view(), name='relay1-status-get'),  # GET method
   
    path("api/relay2-status/<int:device_id>/", Relay2StatusView.as_view(), name="relay2-status-get"),
    path("api/relay2-status/", Relay2StatusView.as_view(), name="relay2-status-post"),
  
    path("api/beep-control/<int:device_id>/", BeepControlFilterView.as_view(), name="beep-control-filter"),
    path("api/beep-control/", BeepControlFilterView.as_view(), name="beep-control-create"),

    #second part 
    path('api/Instantaneoustream_obis/', InstantaneousReadingsAPIView.as_view(), name='stream_obis'),
    path('api/monthly_billing/', MonthlyBillingAPIView.as_view(), name='monthly_billing'),
    path("api/energy_readings/", EnergyReadingsAPIView.as_view(), name="energy-readings-stream"),
    path("api/demand_readings/", DemandReadingsAPIView.as_view(), name="energy-readings-stream"),
    path("api/event_log_information/",EventLogAPIView.as_view(), name="energy-readings-stream"),
    
    path("api/event-log/",EventLogAPIView1.as_view(), name="energy-readings-stream"),
    path("api/event-log2/", EventLogAPIView2.as_view(), name="event-log2"),
    path("api/execute/", ExecuteRunAPIView.as_view(),name="Execute"),
    path('api/loadprofile-period/', LoadProfilePeriodAPIView.as_view(), name='loadprofile-period'),
    path('api/power-quality/', PowerQualityAPIView.as_view(), name='power-quality'),
    
   
    path("api/monthly-billing/", MonthlyBillingView.as_view()),
    path("api/monthly-billing/<int:device_id>/", MonthlyBillingView.as_view()),
    path("api/monthly-billing/item/<int:item_id>/", MonthlyBillingView.as_view()),
    path("api/monthly-billing/clean/<int:device_id>/", MonthlyBillingView.as_view()),


    path("api/daily-billing/", DailyBillingView.as_view()),
    path("api/daily-billing/<int:device_id>/", DailyBillingView.as_view()),
    path("api/daily-billing/item/<int:item_id>/", DailyBillingView.as_view()),
    path("api/daily-billing/clean/<int:device_id>/", DailyBillingView.as_view()),


     path(
        "api/loadprofile1/",
        Loadprofile1EnergyRegisterView.as_view(),
        name="loadprofile1-energy-register-post"
    ),

    path(
        "api/loadprofile1/<int:device_id>/",
        Loadprofile1EnergyRegisterView.as_view(),
        name="loadprofile1-energy-register-get"
    ),

    path(
        "api/loadprofile1/item/<int:item_id>/",
        Loadprofile1EnergyRegisterView.as_view(),
        name="loadprofile1-energy-register-delete-item"
    ),

    path(
        "api/loadprofile1/clean/<int:device_id>/",
        Loadprofile1EnergyRegisterView.as_view(),
        name="loadprofile1-energy-register-clean"
    ),

    
    path("api/loadprofile2/", Loadprofile2EnergyRegisterView.as_view()),
    path("api/loadprofile2/<int:device_id>/", Loadprofile2EnergyRegisterView.as_view()),
    path("api/loadprofile2/item/<int:item_id>/", Loadprofile2EnergyRegisterView.as_view()),
    path("api/loadprofile2/clean/<int:device_id>/", Loadprofile2EnergyRegisterView.as_view()),
    path('invocation-counter/', InvocationCounterAPIView.as_view(), name='invocation-counter'),
    
    # Log file endpoint for progress monitoring
    path('api/logfile/', get_log_file, name='get-log-file'),
]




  
 

