from django.contrib import admin
from .models import *



# admin.py
from django.contrib import admin
from .models import PCAuthentication


@admin.register(PCAuthentication)
class PCAuthenticationAdmin(admin.ModelAdmin):
    list_display = ('user_code', 'is_authenticated', 'activated_at', 'created_at')
    list_filter = ('is_authenticated',)
    search_fields = ('user_code',)
    readonly_fields = ('user_code', 'created_at', 'updated_at', 'activated_at')




admin.site.register(member)
admin.site.register(RegistrationVerification)
admin.site.register(Media)
admin.site.register(Addressing)
admin.site.register(Security)
admin.site.register(Device)
admin.site.register(Meter)
admin.site.register(MeterIdentifier)
admin.site.register(MeterVersion)
admin.site.register(MeterLogicalParameter)
admin.site.register(Threshold)
admin.site.register(TimeSettings)
admin.site.register(TariffParameter)
admin.site.register(TariffThreshold)
admin.site.register(TariffAction)
admin.site.register(TOUCalendarManager)
InstantaneousReading




admin.site.register(RegisterLimiter)
admin.site.register(SecuritySettings)
admin.site.register(PushSetupItem)
admin.site.register(OtherParameters)
admin.site.register(Scheduler)



admin.site.register(AutoConnectSettings)
admin.site.register(AutoAnswerSettings)
admin.site.register(AutoAnswerSettingsCallingWindow)
admin.site.register(AutoAnswerSettingsAllowedCaller)
admin.site.register(ModuleInformation)
admin.site.register(TcpUdpSetup)
admin.site.register(PPPSetup)




from django.contrib import admin
from .models import IPv4Setup, MulticastIPAddress, IPOption

class MulticastIPAddressInline(admin.TabularInline):
    model = MulticastIPAddress
    extra = 1  # Number of empty rows to display for adding new multicast IPs

class IPOptionInline(admin.TabularInline):
    model = IPOption
    extra = 1  # Number of empty rows to display for adding new IP options

class IPv4SetupAdmin(admin.ModelAdmin):
    list_display = ('device', 'data_link_ref', 'ip_address', 'subnet_mask', 'gateway_ip', 'dhcp', 'primary_dns', 'secondary_dns')
    search_fields = ('device__id', 'ip_address', 'data_link_ref')
    list_filter = ('dhcp',)
    inlines = [MulticastIPAddressInline, IPOptionInline]  # Displaying the related models inline

class MulticastIPAddressAdmin(admin.ModelAdmin):
    list_display = ('ipv4_setup', 'ip_address')
    search_fields = ('ipv4_setup__data_link_ref', 'ip_address')

class IPOptionAdmin(admin.ModelAdmin):
    list_display = ('ipv4_setup', 'option_type', 'data')
    search_fields = ('ipv4_setup__data_link_ref', 'option_type', 'data')
    list_filter = ('option_type',)

# Register models with the admin site
admin.site.register(IPv4Setup, IPv4SetupAdmin)
admin.site.register(MulticastIPAddress, MulticastIPAddressAdmin)
admin.site.register(IPOption, IPOptionAdmin)


admin.site.register(GprsSetup)
admin.site.register(EnergyRegister)
admin.site.register(StateOfInternalControl)

admin.site.register(ErrorRegister1)
admin.site.register(ErrorRegister2)

admin.site.register(AlarmRegister1)
admin.site.register(AlarmRegister2)

admin.site.register(AlarmFilter1)
admin.site.register(AlarmFilter2)

admin.site.register(AlarmDescriptor1)
admin.site.register(AlarmDescriptor2)

admin.site.register(EventReportFilter)

admin.site.register(DemandConfigure)


admin.site.register(Payment)
admin.site.register(PaymentDetail)

admin.site.register(ActiveEnergyRegister)
admin.site.register(ReactiveEnergyRegister)
admin.site.register(ApparentEnergyRegister)
admin.site.register(TokenGatewayConfig)

admin.site.register(TokenCredit)
admin.site.register(EmergencyCredit)
admin.site.register(LcdDisplayFormat)
admin.site.register(DisplayParameter)

admin.site.register(LoadControlSettings)

admin.site.register(Relay1Status)

admin.site.register(BeepControlFilter)
admin.site.register(UnitCharge)

admin.site.register(InstantaneousReading)
admin.site.register(EnergyReading)
admin.site.register(DemandReading)

admin.site.register(EventLog)
admin.site.register(EventLog2)
admin.site.register(ExecuteCommand)
admin.site.register(LoadProfileReading)
admin.site.register(PowerQualityReading)