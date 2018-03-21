Title: CentOS Based iSCSI Target (Server)
Date: 2016-12-08 10:20
Category: SysAdmin
Tags: CentOS, iSCSI, PXE, DHCP, TFTP

## Requirements

- CentOS (but should apply well to other distros)
- Disks or LVM Volumes to serve
- Patience 


## Software Stack

- [CentOS](https://www.centos.org/)
- [ISC dhcp](https://www.isc.org/downloads/dhcp/)
- [tftp-hpa](https://www.kernel.org/pub/software/network/tftp/)
- [iPXE](https://ipxe.org/)
- [Open-iSCSI](http://www.open-iscsi.com/)

## Hardware Stack

While not terribly important ill give a list of some of the hardware i used to set this up. Of 
note here is the fact that no special expensive iSCSI controller cards are used to boot. Instead 
we rely on chainbooting iPXE which is capable of filling that role at no extra cost. I am 
using a raid controller with 256mb to help with speed and to give me more ports on this old 
machine as well as free up some CPU cycles. The server class nic will be used for the iscsi disks 
only. Each port will be dedicated to a iscsi disk.

- 3Ware 8-Port Sata RAID Controller
- 6X500GB SATAII (2XRAID1 iSCSI Targets, 1XRAID1 Boot Drive)
- Intel Onboard 1000mbit NIC X 2
- Intel PCI-X Dual Port 1000mbit Server NIC
- Intel P4 CPU
- Supermicro Server Motherboard

The clients will initially consist of an old AM2 based AMD machine and a newer small form 
factor E-350 based machine. Both machines will be using iPXE to boot iSCSI. Both machines will 
be setup using Arch Linux.

## Installation

Everything needed is available under the base CentOS repo so lukily the software installing 
is trivial. We will of course just use yum for this as follows.

    [root@tgtd html]# yum install iscsi-initiator-utils dhcp tftp-server syslinux
    
If you are using another distro you will need to find the equivalent commands yourself. 
iscsi-initiator-utils may be called open-iscsi on some distros for example.

## iSCSI Target Server

I am exporting full disks, but you can easily export LVM volumes too. If you want to use 
LVM volumes then create it as follows, skip this otherwise.

    # Assumed sdb is a disk to export, created 20gb volume.
    [root@tgtd html]# pvcreate /dev/sdb1
    [root@tgtd html]# vgcreate -s 32M vg_target00 /dev/sdb1
    [root@tgtd html]# lvcreate -L 20G -n lv_target00 vg_target00
    
Now we need to tell the iscsi daemon what disks we want to export by editing `/etc/tgt/targets.conf`. 
If you are using LVM you should change `direct-store` to `backing-store`. Make sure to update 
the disk paths if you are using LVM instead.

    default-driver iscsi
    
    <target iqn.2012-11.li.cudd.router:htpc1>
        direct-store /dev/sdb
    </target>
    
    # Optional extra disks to export
    <target iqn.2012-11.li.cudd.router:htpc2>
        direct-store /dev/sdc
    </target>
    
You should now be able to (re)start your iscsi target.

    [root@tgtd html]# /etc/init.d/tgtd start
    Starting SCSI target daemon:  [OK]
    
Verify its working by running tgtadm --mode target --op show. You should see the same number of 
Targets defined as you have added to the configuration earlier. In my case its 2 as shown.

    [root@tgtd html]# tgtadm --mode target --op show
    Target 1: iqn.2012-11.li.cudd.router:htpc1
    System information:
        Driver: iscsi
        State: ready
    I_T nexus information:
        I_T nexus: 51
            Initiator: iqn.2012-11.li.cudd.htpc1:htpc1
            Connection: 0
                IP Address: 172.16.1.13
    LUN information:
        LUN: 0
            Type: controller
            SCSI ID: IET     00010000
            SCSI SN: beaf10
            Size: 0 MB, Block size: 1
            Online: Yes
            Removable media: No
            Prevent removal: No
            Readonly: No
            Backing store type: null
            Backing store path: None
            Backing store flags:
        LUN: 1
            Type: disk
            SCSI ID: IET     00010001
            SCSI SN: 9QG1CAH1A9D54D00A538
            Size: 499989 MB, Block size: 512
            Online: Yes
            Removable media: No
            Prevent removal: No
            Readonly: No
            Backing store type: rdwr
            Backing store path: /dev/sdb
            Backing store flags:
    Account information:
    ACL information:
        ALL
    Target 2: iqn.2012-11.li.cudd.router:htpc2
    System information:
        Driver: iscsi
        State: ready
    I_T nexus information:
    LUN information:
        LUN: 0
            Type: controller
            SCSI ID: IET     00020000
            SCSI SN: beaf20
            Size: 0 MB, Block size: 1
            Online: Yes
            Removable media: No
            Prevent removal: No
            Readonly: No
            Backing store type: null
            Backing store path: None
            Backing store flags:
        LUN: 1
            Type: disk
            SCSI ID: IET     00020001
            SCSI SN: 9QG3WDLVA9D55200415D
            Size: 499989 MB, Block size: 512
            Online: Yes
            Removable media: No
            Prevent removal: No
            Readonly: No
            Backing store type: rdwr
            Backing store path: /dev/sdc
            Backing store flags:
    Account information:
    ACL information:
        ALL
        
If that worked correctly you can now set it to start on boot.

    [root@tgtd html]# chkconfig tgtd on
    
## DHCP Server

Open your dhcp config file located at `/etc/dhcp/dhcpd.conf`. And configure it as follows, adjusting 
for your own network topology. You must make sure that the iscsi target configured matches the 
one you configure for the host in dhcp. My target is `iqn.2012-11.li.cudd.router:htpc1`. Which 
you can see configured below along with the address of the iscsi target `172.16.1.10`. You must 
change these.

    # Tell dhcp about extra ipxe options available
    option ipxe.keep-san code 8 = unsigned integer 8;
    option ipxe.no-pxedhcp code 176 = unsigned integer 8;
    option ipxe.pxe code 33 = unsigned integer 8;
    
    allow booting;
    allow bootp;
    option domain-name "cudd.li";
    option domain-name-servers 172.16.1.2, 8.8.8.8;
    
    default-lease-time 600;
    max-lease-time 7200;
    
    # Use this to enble / disable dynamic dns updates globally.
    #ddns-update-style none;
    
    # If this DHCP server is the official DHCP server for the local
    # network, the authoritative directive should be uncommented.
    authoritative;
    
    # Use this to send dhcp log messages to a different log file (you also
    # have to hack syslog.conf to complete the redirection).
    log-facility local7;
    
    subnet 172.16.1.0 netmask 255.255.255.0 {
        range 172.16.1.200 172.16.1.250;
        option routers 172.16.1.1;
        option subnet-mask 255.255.255.0;
        option domain-search "cudd.li";
        option domain-name-servers 172.16.1.2,8.8.8.8;
        filename "/pxelinux.0";
        next-server 172.16.1.2;
    }
    
    # A group for iPXE bootable hosts
    group {
        # Avoid infinite loop
        if exists user-class and ( option user-class = "iPXE" ) {
            filename "";
        } else {
            filename "/undionly.kpxe";
        }
    
        option ipxe.keep-san 1;
        option ipxe.no-pxedhcp 1;
    
        # My HTPC host
        host htpc1 {
            option host-name "htpc1.cudd.li";
            hardware ethernet 00:01:2e:33:51:2d;
            fixed-address 172.16.1.13;
            option root-path "iscsi:172.16.1.10:::1:iqn.2012-11.li.cudd.router:htpc1";
        }
    }
    
With that setup we can start it and set it to autostart on boot.

    [root@tgtd html]# service dhcpd start
    [root@tgtd html]# chkconfig dhcpd on
    
## TFTP Server

The TFTP server is launched as a xinetd service. On centos this service is disabled by 
default. Open `/etc/xinetd.d/tftp` and set disable to no.

    service tftp
    {
        socket_type     = dgram
        protocol        = udp
        wait            = yes
        user            = root
        server          = /usr/sbin/in.tftpd
        server_args     = -s /var/lib/tftpboot
        disable         = no
        per_source      = 11
        cps         = 100 2
        flags           = IPv4
    }
    
(Optional) Copy some helpful files into the tftp root. Enable PXE booting of installation images.

    cp /usr/lib/syslinux/pxelinux.0 /var/lib/tftpboot/
    cp /usr/lib/syslinux/menu.c32 /var/lib/tftpboot
    mkdir /var/lib/tftpboot/pxelinux.cfg

With the required pxe files in place we can create a basic boot option menu. The default config 
loaded is `/var/lib/tftpboot/pxelinux.cfg/default`. Open it and configure to your pleasing. 
My example shows 2 PXE Image OS installers and a NFS root system boot setup. These are all 
optional and you can setup your own client OS's as you please. For reference the paths 
are all relative to the tftp root defined as `/var/lib/tftpboot` in the tftp config. This 
means that the kernel in label 1 points to the full path of `/var/lib/tftpboot/centos63/vmlinuz`

    timeout 10
    default menu.c32
    menu title $$$$$$Boot Sale On Now!$$$$$$
    
    label 1
        menu label ^ 1) CentOS 6.3 x86_64 Install
        kernel centos63/vmlinuz
        append initrd=centos63/initrd.img
    
    label 2
        menu label ^ 2) HTPC1 via nfsroot
        kernel htpc1/vmlinuz-linux
        append initrd=htpc1/initramfs-linux.img rootfstype=nfs4 root=/dev/nfs nfsroot=172.16.1.4:/tank/nfsroot/htpc1,v4,rsize=16384,wsize=16384 ip=:::::eth0:dhcp
    
    label 3
        menu label ^ 3) Arch Installer i386/x86_64
        kernel arch_install/vmlinuz
        append initrd=arch_install/archiso.img

Instead of all this you can just boot an installation DVD too. Up to you how you prefer to setup 
client systems.

Then we start `xinetd` and enable auto start upon boot.

    [root@tgtd html]# service xinetd start
    [root@tgtd html]# chkconfig xinetd on
    
From this point you should have a working iSCSI target setup for client installation.

## Client Setup

I will not be going over how to configure a specific OS for booting over iSCSI. I did 
however have success using the [Arch Linux ISCSI Boot Instructions](https://wiki.archlinux.org/index.php/ISCSI_Boot) 
wiki page. For CentOS clients the iSCSI support is built into the installer so its 
just a matter of choosing the advanced storage options and manually adding a target. 
This is a much more streamlined way of doing it over Arch depending on your needs.

## Performance 

For reference i am getting about 50MB/s sequential write speeds and 80MB/s sequential 
read speeds on each target. If you factor in the fact that the drives are very old 
(~2004) and iSCSI protocol overhead, the speeds are great. CPU usage is minimal and 
not much of a factor in this.

## Troubleshooting

First step is trying to see whats going on in the logs. DHCP and tftp will both log 
to syslog by default. Watch the log by tailing it as you try and boot.

    [root@client ~]# tailf /var/log/messages
    
To make sure iSCSI is functioning correctly we can try connecting from an existing host.

    [root@client ~]# iscsiadm -m node -Tiqn.2012-11.li.cudd.router:htpc1 -p 172.16.1.10 -l
    Logging in to [iface: default, target: iqn.2012-11.li.cudd.router:htpc1, portal: 172.16.1.10,3260] (multiple)
    Login to [iface: default, target: iqn.2012-11.li.cudd.router:htpc1, portal: 172.16.1.10,3260] successful.
    
Your kernel log, dmesg, should print something like the following if the disk attached correctly.

    [root@client ~]# dmesg
    ... snip ...
    [90168.273162] scsi8 : iSCSI Initiator over TCP/IP
    [90168.529067] scsi 8:0:0:0: RAID              IET      Controller       0001 PQ: 0 ANSI: 5
    [90168.530069] scsi 8:0:0:1: Direct-Access     AMCC     9500S-8    DISK  2.06 PQ: 0 ANSI: 5
    [90168.530751] sd 8:0:0:1: [sdc] 976541696 512-byte logical blocks: (499 GB/465 GiB)
    [90168.531444] sd 8:0:0:1: [sdc] Write Protect is off
    [90168.531451] sd 8:0:0:1: [sdc] Mode Sense: 49 00 00 08
    [90168.532005] sd 8:0:0:1: [sdc] Write cache: enabled, read cache: enabled, doesn't support DPO or FUA
    [90168.534263]  sdc: sdc1
    [90168.536225] sd 8:0:0:1: [sdc] Attached SCSI disk
    
You can use the -u flag to disconnect from the device again.

    [root@client ~]# iscsiadm -m node -Tiqn.2012-11.li.cudd.router:htpc1 -p 172.16.1.10 -u
    Logging out of session [sid: 3, target: iqn.2012-11.li.cudd.router:htpc1, portal: 172.16.1.10,3260]
    Logout of [sid: 3, target: iqn.2012-11.li.cudd.router:htpc1, portal: 172.16.1.10,3260] successful.
    
   




        