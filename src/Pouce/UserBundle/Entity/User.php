<?php
// src/Pouce/UserBundle/Entity/User.php

namespace Pouce\UserBundle\Entity;

use Gedmo\Mapping\Annotation as Gedmo; // this will be like an alias for Gedmo extensions annotations
use FOS\UserBundle\Model\User as BaseUser;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\HttpFoundation\File\File;
use Vich\UploaderBundle\Mapping\Annotation as Vich;


/**
 * @ORM\Entity
 * @ORM\Table(name="user")
 * @ORM\Entity(repositoryClass="Pouce\UserBundle\Entity\UserRepository")
 * @Vich\Uploadable
 */
class User extends BaseUser
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre prénom.", groups={"updateRegistration"})
     */
    protected $first_name;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre nom de famille.", groups={"updateRegistration"})
     */
    protected $last_name;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre sexe.", groups={"updateRegistration"})
     * @Assert\Choice({"Homme", "Femme"})
     */
    protected $sex;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre promotion.", groups={"updateRegistration"})
     * @Assert\Choice({"Bac +1", "Bac +2", "Bac +3", "Bac +4", "Bac +5", "Bac +6", "Doctorant"})
     */
    protected $promotion;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\Regex("/\d+/")
     * @Assert\Length(min=9, max=15, minMessage="Le numéro de téléphone doit avoir 10 chiffres minimum.", maxMessage="Le numéro de téléphone doit avoir 15 chiffres maximum")
     * @Assert\NotBlank(message="Entrez votre numéro de téléphone.", groups={"updateRegistration"})
     */
    protected $telephone;

    /* ************************************************************

                        VichUploaderBundle fields

    ************************************************************ */

    /**
     * NOTE: This is not a mapped field of entity metadata, just a simple property.
     * 
     * @Vich\UploadableField(mapping="profil_images", fileNameProperty="imageName")
     * 
     * @var File
     */
    private $imageFile;

    /**
     * @ORM\Column(type="string", length=255)
     *
     * @var string
     */
    private $imageName;

    /**
     * @ORM\Column(type="datetime")
     *
     * @var \DateTime
     */
    private $updatedAt;

    /* ************************************************************
                        End of VichUploaderBundle fields
    ************************************************************ */

    /**
     * @ORM\ManyToMany(targetEntity="Pouce\TeamBundle\Entity\Team", mappedBy="users")
     */
    private $teams;

    /**
     * @ORM\ManyToOne(targetEntity="Pouce\UserBundle\Entity\School")
     * @ORM\JoinColumn(name="school_id", referencedColumnName="id", nullable=false)
     *
     */
    private $school;

    /**
     * @var datetime $created
     *
     * @Gedmo\Timestampable(on="create")
     * @ORM\Column(type="datetime")
     */
    private $created;

    /**
     * @var \DateTime $updated
     *
     * @Gedmo\Timestampable(on="update")
     * @ORM\Column(type="datetime")
     */
    private $updated;


    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set first_name
     *
     * @param string $first_name
     * @return User
     */
    public function setFirstName($first_name)
    {
        $this->first_name = $first_name;

        return $this;
    }

    /**
     * Get first_name
     *
     * @return string 
     */
    public function getFirstName()
    {
        return $this->first_name;
    }

    /**
     * Set last_name
     *
     * @param string $last_name
     * @return User
     */
    public function setLastName($last_name)
    {
        $this->last_name = $last_name;

        return $this;
    }

    /**
     * Get last_name
     *
     * @return string 
     */
    public function getLastName()
    {
        return $this->last_name;
    }


    /**
     * Set sex
     *
     * @param string $sex
     * @return User
     */
    public function setSex($sex)
    {
        $this->sex = $sex;

        return $this;
    }

    /**
     * Get sex
     *
     * @return string 
     */
    public function getSex()
    {
        return $this->sex;
    }

    /**
     * Set promotion
     *
     * @param string $promotion
     * @return User
     */
    public function setPromotion($promotion)
    {
        $this->promotion = $promotion;

        return $this;
    }

    /**
     * Get promotion
     *
     * @return string 
     */
    public function getPromotion()
    {
        return $this->promotion;
    }

    /**
     * Set telephone
     *
     * @param string $telephone
     * @return User
     */
    public function setTelephone($telephone)
    {
        $this->telephone = $telephone;

        return $this;
    }

    /**
     * Get telephone
     *
     * @return string 
     */
    public function getTelephone()
    {
        return $this->telephone;
    }

    /**
     * Set created
     *
     * @param \DateTime $created
     * @return User
     */
    public function setCreated($created)
    {
        $this->created = $created;

        return $this;
    }

    /**
     * Get created
     *
     * @return \DateTime 
     */
    public function getCreated()
    {
        return $this->created;
    }

    /**
     * Set updated
     *
     * @param \DateTime $updated
     */
    public function setUpdated($updated)
    {
        $this->updated = $updated;

        return $this;
    }

    /**
     * Get updated
     *
     * @return \DateTime 
     */
    public function getUpdated()
    {
        return $this->updated;
    }

    public function setSchool(School $school)
    {
    $this->school = $school;

    return $this;
    }

    public function getSchool()
    {
    return $this->school;
    }
    /**
     * Constructor
     */
    public function __construct()
    {
        parent::__construct();
        $this->teams = new ArrayCollection();
    }

    public function getCompleteName() {
        return $this->getFirstName() . ' ' . $this->getLastName();
    }

    /**
     * Add teams
     *
     * @param \Pouce\TeamBundle\Entity\Team $teams
     * @return User
     */
    public function addTeam(\Pouce\TeamBundle\Entity\Team $teams)
    {
        $this->teams[] = $teams;
        $teams->addUser($this);

        return $this;
    }

    /**
     * Remove teams
     *
     * @param \Pouce\TeamBundle\Entity\Team $teams
     */
    public function removeTeam(\Pouce\TeamBundle\Entity\Team $teams)
    {
        $this->teams->removeElement($teams);
        $teams->setUser(null);
    }

    /**
     * Get teams
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getTeams()
    {
        return $this->teams;
    }

    /* ************************************************************

                VichUploaderBundle getters and setters

    ************************************************************ */


    /**
     * If manually uploading a file (i.e. not using Symfony Form) ensure an instance
     * of 'UploadedFile' is injected into this setter to trigger the  update. If this
     * bundle's configuration parameter 'inject_on_load' is set to 'true' this setter
     * must be able to accept an instance of 'File' as the bundle will inject one here
     * during Doctrine hydration.
     *
     * @param File|\Symfony\Component\HttpFoundation\File\UploadedFile $image
     */
    public function setImageFile(File $image = null)
    {
        $this->imageFile = $image;

        if ($image) {
            // It is required that at least one field changes if you are using doctrine
            // otherwise the event listeners won't be called and the file is lost
            $this->updatedAt = new \DateTime('now');
        }
    }

    /**
     * @return File
     */
    public function getImageFile()
    {
        return $this->imageFile;
    }

    /**
     * @param string $imageName
     */
    public function setImageName($imageName)
    {
        $this->imageName = $imageName;
        $this->updatedAt = new \DateTime('now');
    }

    /**
     * @return string
     */
    public function getImageName()
    {
        return $this->imageName;
    }

    /* ************************************************************
                End of VichUploaderBundle getters and setters
    ************************************************************ */

}
